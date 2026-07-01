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

  // 1. Ambil detail plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    redirect('/workout')
  }

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
    .eq('plan_id', planId)
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
