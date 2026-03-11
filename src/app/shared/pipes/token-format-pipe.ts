import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tokenFormat',
  standalone: true,
})
export class TokenFormatPipe implements PipeTransform {

  transform(value: number | null | undefined, decimals: number = 1): string {
    if (value == null || isNaN(value)) return '0';

    if (value < 1000) return value.toString();
    if (value < 1_000_000) return `${(value / 1000).toFixed(decimals)}K`;
    if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
}
