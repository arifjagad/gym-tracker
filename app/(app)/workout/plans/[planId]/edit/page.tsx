import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanEditor } from '@/components/workout/plan-editor'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ planId: string }>
}

export default async function EditPlanPage({ params }: PageProps) {
  const resolvedParams = await params
  const planId = resolvedParams.planId

  const supabase = await createClient()

  // Ambil data user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Parse shortId jika planId berbentuk `slug-shortId` (e.g. `split-3-hari-1678ec4e`)
  let shortId = planId
  if (planId.includes('-')) {
    const parts = planId.split('-')
    const lastPart = parts[parts.length - 1]
    if (lastPart.length === 8 && /^[0-9a-fA-F]+$/.test(lastPart)) {
      shortId = lastPart
    }
  }

  let plan = null
  let planError = null

  // Cek apakah planId adalah UUID penuh
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId)

  if (isUUID) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    plan = data
    planError = error
  } else {
    // Ambil plans user, cari yang berawalan shortId
    const { data: userPlans, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
    
    if (userPlans) {
      plan = userPlans.find((p: any) => p.id.substring(0, 8) === shortId) || null
    }
    if (fetchError && !plan) {
      planError = fetchError
    }
  }

  if (planError || !plan) {
    redirect('/workout')
  }

  const actualPlanId = plan.id

  // 2. Ambil kategori dan nested exercises
  const { data: categories, error: catError } = await supabase
    .from('plan_categories')
    .select(`
      id,
      category_name,
      day_of_week,
      plan_exercises (
        id,
        sort_order,
        exercise_id,
        exercises (
          id,
          name,
          body_part,
          target,
          equipment
        )
      )
    `)
    .eq('plan_id', actualPlanId)
    .order('created_at')

  const initialCategories = categories ? categories.map((cat: any) => {
    // Sort plan_exercises by sort_order ascending
    const sortedExercises = [...(cat.plan_exercises || [])].sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )
    return {
      ...cat,
      plan_exercises: sortedExercises
    }
  }) : []

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <PlanEditor plan={plan} initialCategories={initialCategories} />
    </main>
  )
}
