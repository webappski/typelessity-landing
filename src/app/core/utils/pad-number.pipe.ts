import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'padNumber', standalone: true, pure: true })
export class PadNumberPipe implements PipeTransform {
  transform(value: number | string, len = 2): string {
    return String(value).padStart(len, '0');
  }
}
