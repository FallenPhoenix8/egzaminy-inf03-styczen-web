export default (examName: string) => {
  return navigateTo(`/exams/${encodeURIComponent(examName)}`)
}
