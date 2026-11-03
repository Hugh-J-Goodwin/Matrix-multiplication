import {zero} from './matrix.js';
export const sharedNames = (project, size = project.size) => Array.from({length:size}, (_, i) => project.labels?.[i] ?? `Item ${i + 1}`);
export function normalizeProject(project) {
  return {...project, c: project.c ?? zero(project.size), labels: sharedNames(project), tertiary: project.tertiary ?? false, orderC: project.orderC ?? 2, ruleC: project.ruleC ?? '1/(2^n)', cumulativeC: project.cumulativeC ?? true};
}
export function resizeProject(project, size) {
  const fit = matrix => Array.from({length:size}, (_, i) => Array.from({length:size}, (_, j) => matrix?.[i]?.[j] ?? 0));
  return {size, a:fit(project.a), b:fit(project.b), c:fit(project.c), labels:sharedNames(project, size)};
}
