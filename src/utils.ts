export function convertDateStringToUnixTimeSecond(dateString: string) {
  // date string format: DD/mm/YYYY hh:mm:ss, for example: 01/01/2022 00:00:00, time will be in UTC
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  const formattedDate = `${month}/${day}/${year} ${hours}:${minutes}:${seconds} UTC`;
  const dateObject = new Date(formattedDate);

  if (isNaN(dateObject.getTime())) {
    throw new Error('Invalid date');
  }
  const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
  return unixTimestamp;
}

export function convertUnixTimeToDateString(unixTimestamp: number) {
  const date = new Date(unixTimestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

