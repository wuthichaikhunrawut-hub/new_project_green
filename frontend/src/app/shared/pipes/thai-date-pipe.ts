import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thaiDate',
  standalone: true,
})
export class ThaiDatePipe implements PipeTransform {
  transform(value: string | Date | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    const day = date.getDate();
    const monthNames = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543; // บวก 543 เป็น พ.ศ.

    return `${day} ${month} ${year}`;
  }
}
