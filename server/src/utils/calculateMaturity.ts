export function calculateMaturity(startDateStr: string, months: number = 12): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    return startDateStr;
  }
  
  date.setMonth(date.getMonth() + months);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  
  return `${yyyy}-${mm}-${dd}`;
}
