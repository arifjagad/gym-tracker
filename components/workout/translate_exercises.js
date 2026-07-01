const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env variables manually
const envPath = path.join(__dirname, '../../.env'); // Adjust path to the workspace root .env
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Failed to read .env file at:', envPath, e);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. Translations mapping dictionaries
const BODY_PART_MAP = {
  'back': 'punggung',
  'cardio': 'kardio',
  'chest': 'dada',
  'lower arms': 'lengan bawah',
  'lower legs': 'betis',
  'neck': 'leher',
  'shoulders': 'bahu',
  'upper arms': 'lengan atas',
  'upper legs': 'paha',
  'waist': 'perut',
};

const TARGET_MAP = {
  'abs': 'perut',
  'adductors': 'paha dalam (adduktor)',
  'abductors': 'paha luar (abduktor)',
  'biceps': 'bisep',
  'calves': 'betis',
  'cardiovascular system': 'sistem kardiovaskular',
  'delts': 'bahu (deltoid)',
  'forearms': 'lengan bawah',
  'glutes': 'bokong (gluteus)',
  'hamstrings': 'paha belakang (hamstring)',
  'lats': 'punggung samping (lats)',
  'levator scapulae': 'belikat (levator scapulae)',
  'pectorals': 'dada (pektoral)',
  'quads': 'paha depan (quads)',
  'serratus anterior': 'otot gergaji (serratus)',
  'spine': 'tulang belakang',
  'traps': 'pundak (trapezius)',
  'triceps': 'trisep',
  'upper back': 'punggung atas',
};

const EQUIPMENT_MAP = {
  'assisted': 'bantuan alat',
  'band': 'karet resistance',
  'barbell': 'barbel',
  'body weight': 'berat badan',
  'cable': 'kabel mesin',
  'dumbbell': 'dumbbell',
  'elliptical machine': 'mesin elips',
  'ez barbell': 'barbel ez',
  'hammer': 'hammer',
  'kettlebell': 'kettlebell',
  'leverage machine': 'leverage machine',
  'medicine ball': 'medicine ball',
  'olympic barbell': 'barbel olimpiade',
  'resistance band': 'karet resistance',
  'rope': 'tali',
  'roller': 'roller',
  'stability ball': 'bola keseimbangan',
  'stationary bike': 'sepeda statis',
  'smith machine': 'mesin smith',
  'tire': 'ban',
  'trap bar': 'trap bar',
  'weighted': 'beban tambahan',
  'wheel roller': 'wheel roller',
  'none': 'tanpa alat',
};

// 3. Translation Google Translate free API function
async function translateText(text) {
  if (!text) return '';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json[0].map(segment => segment[0]).join('');
  } catch (err) {
    console.error(`Error translating text "${text}":`, err.message);
    return text;
  }
}

async function translateInstructions(instructions) {
  if (!Array.isArray(instructions) || instructions.length === 0) return [];
  const joined = instructions.join('\n');
  const translatedJoined = await translateText(joined);
  return translatedJoined.split('\n').map(s => s.trim()).filter(Boolean);
}

// 4. Main function
async function run() {
  console.log('Fetching exercises from database (range 1000-1999)...');
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('id')
    .range(1000, 1999);

  if (error) {
    console.error('Failed to query exercises:', error);
    process.exit(1);
  }

  console.log(`Loaded ${exercises.length} exercises. Starting translation process...`);

  let count = 0;
  const batchSize = 10;

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);
    
    // Process batch in parallel
    const promises = batch.map(async (ex) => {
      // 1. Translate name
      const translatedName = await translateText(ex.name);

      // 2. Translate dictionary values
      const origBodyPart = (ex.body_part || '').toLowerCase().trim();
      const translatedBodyPart = BODY_PART_MAP[origBodyPart] || ex.body_part;

      const origTarget = (ex.target || '').toLowerCase().trim();
      const translatedTarget = TARGET_MAP[origTarget] || ex.target;

      const origEquipment = (ex.equipment || '').toLowerCase().trim();
      const translatedEquipment = EQUIPMENT_MAP[origEquipment] || ex.equipment;

      // 3. Translate instructions
      const translatedInstructions = await translateInstructions(ex.instructions);

      // 4. Update row in database
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          name: translatedName,
          body_part: translatedBodyPart,
          target: translatedTarget,
          equipment: translatedEquipment,
          instructions: translatedInstructions
        })
        .eq('id', ex.id);

      if (updateError) {
        console.error(`Failed to update exercise ${ex.id}:`, updateError.message);
      } else {
        count++;
        if (count % 50 === 0) {
          console.log(`Translated & updated ${count} of ${exercises.length} exercises...`);
        }
      }
    });

    await Promise.all(promises);

    // Rate limiting delay between batches (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Translation complete. Updated ${count} exercises successfully.`);
}

run();
