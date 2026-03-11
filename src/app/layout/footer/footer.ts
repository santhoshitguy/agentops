import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  // Filter signals
  agentFilters = signal([
    { id: 'reset', label: 'Reset', active: false, color: '#78909c' },
    { id: 'researcher', label: 'Researcher', active: true, color: '#ff4081' },
    { id: 'paint', label: 'Paint', active: false, color: '#ffea00' },
    { id: 'scorer', label: 'Scorer', active: true, color: '#ff9100' },
    { id: 'roast', label: 'Roast', active: false, color: '#ff5252' },
    { id: 'fmss', label: 'Fmss', active: false, color: '#b388ff' },
    { id: 'sot', label: 'Sot', active: false, color: '#00e676' },
    { id: 'rise', label: 'Rise', active: false, color: '#40c4ff' },
    { id: 'usd', label: 'USD', active: false, color: '#00e5ff' },
    { id: 'remoteprocess', label: 'Remote process', active: false, color: '#78909c' }
  ]);

  // Timestamp
  currentTimestamp = signal('');
  toggleFilter(id: string): void {
    this.agentFilters.update(filters =>
      filters.map(f => f.id === id ? { ...f, active: !f.active } : f)
    );
  }
}
