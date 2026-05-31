const INDEX_KEY = 'curricula:index'

function getIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY)) || []
  } catch {
    return []
  }
}

function setIndex(ids) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids))
  } catch (e) {
    console.error('storage setIndex failed', e)
  }
}

export function saveCurriculum(curriculum) {
  try {
    localStorage.setItem(`curricula:${curriculum.id}`, JSON.stringify(curriculum))
    const ids = getIndex()
    if (!ids.includes(curriculum.id)) {
      ids.push(curriculum.id)
      setIndex(ids)
    }
  } catch (e) {
    console.error('saveCurriculum failed', e)
  }
}

export function getCurriculum(id) {
  try {
    return JSON.parse(localStorage.getItem(`curricula:${id}`)) || null
  } catch {
    return null
  }
}

export function getAllCurricula() {
  const ids = getIndex()
  return ids
    .map(id => getCurriculum(id))
    .filter(Boolean)
}

export function deleteCurriculum(id) {
  try {
    localStorage.removeItem(`curricula:${id}`)
    const ids = getIndex().filter(i => i !== id)
    setIndex(ids)
  } catch (e) {
    console.error('deleteCurriculum failed', e)
  }
}

export function updateLesson(curriculumId, lessonId, updates) {
  try {
    const curriculum = getCurriculum(curriculumId)
    if (!curriculum) return
    curriculum.lessons = curriculum.lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    )
    curriculum.lastVisitedAt = new Date().toISOString()
    saveCurriculum(curriculum)
  } catch (e) {
    console.error('updateLesson failed', e)
  }
}

// Browser console test helper
export function testStorage() {
  const testId = 'test-' + Date.now()
  const curriculum = {
    id: testId,
    name: 'Test',
    topic: 'Testing',
    level: 'beginner',
    createdAt: new Date().toISOString(),
    lastVisitedAt: new Date().toISOString(),
    lessons: [{ id: 'l1', type: 'concept', title: 'Intro', status: 'active', order: 0 }],
  }
  saveCurriculum(curriculum)
  console.assert(getCurriculum(testId)?.name === 'Test', 'getCurriculum failed')
  console.assert(getAllCurricula().some(c => c.id === testId), 'getAllCurricula failed')
  updateLesson(testId, 'l1', { status: 'complete' })
  console.assert(getCurriculum(testId)?.lessons[0].status === 'complete', 'updateLesson failed')
  deleteCurriculum(testId)
  console.assert(!getCurriculum(testId), 'deleteCurriculum failed')
  console.log('All storage tests passed')
}
