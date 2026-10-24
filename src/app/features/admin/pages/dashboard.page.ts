
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { SalonApiService } from '../../../core/services/salon-api.service';
import { Appointment } from '../../../core/models/models';

const ymd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayOf = (value: string): string => {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : ymd(date);
};

const count = (appointments: Appointment[]) => ({
  total: appointments.length,
  pending: appointments.filter(a => a.status === 'pending').length,
  confirmed: appointments.filter(a => a.status === 'confirmed').length,
  cancelled: appointments.filter(a => a.status === 'cancelled').length
});

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="dashboard">
      <header class="page-header">
        <div class="page-heading">
          <h1>Dashboard</h1>
          <p class="page-subtitle">
            Monitor appointments and manage your salon activity.
          </p>
        </div>

        <div class="header-actions">
          <label class="date-control">
            <span>Selected date</span>
            <input
              type="date"
              [ngModel]="date()"
              (ngModelChange)="date.set($event)"
            />
          </label>

          <button
            type="button"
            class="refresh-btn"
            [disabled]="loading()"
            (click)="loadAppointments()"
          >
            <span [class.spinning]="loading()">↻</span>
            Refresh
          </button>
        </div>
      </header>

      @if (loading() && all().length === 0) {
        <section class="state-card">
          <div class="spinner"></div>
          <h3>Loading dashboard</h3>
          <p>Please wait while we fetch your appointments.</p>
        </section>
      }

      @if (error()) {
        <section class="error-banner">
          <div>
            <strong>Unable to load appointments</strong>
            <p>{{ error() }}</p>
          </div>
          <button type="button" (click)="loadAppointments()">
            Try again
          </button>
        </section>
      }

      @if (!loading() || all().length > 0) {
        <section class="stats-grid">
          <article class="stat-card">
            <div class="stat-top">
              <span class="stat-label">Total Appointments</span>
              <span class="stat-icon purple">▤</span>
            </div>
            <div class="stat-value">{{ allStats().total }}</div>
            <div class="stat-footer">
              <span class="status-dot purple-dot"></span>
              Scheduled for selected date
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-top">
              <span class="stat-label">Pending Requests</span>
              <span class="stat-icon amber">◷</span>
            </div>
            <div class="stat-value">{{ allStats().pending }}</div>
            <div class="stat-footer">
              <span class="status-dot pending-dot"></span>
              Awaiting confirmation
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-top">
              <span class="stat-label">Confirmed</span>
              <span class="stat-icon green">✓</span>
            </div>
            <div class="stat-value">{{ allStats().confirmed }}</div>
            <div class="stat-footer">
              <span class="status-dot confirmed-dot"></span>
              Confirmed appointments
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-top">
              <span class="stat-label">Cancelled</span>
              <span class="stat-icon red">×</span>
            </div>
            <div class="stat-value">{{ allStats().cancelled }}</div>
            <div class="stat-footer">
              <span class="status-dot cancelled-dot"></span>
              Cancelled appointments
            </div>
          </article>
        </section>

        <section class="content-grid">
          <article class="panel analytics-panel">
            <div class="panel-header">
              <div>
                <h2>Appointment Activity</h2>
                <p>Daily requests over the last 7 days</p>
              </div>
              <span class="period-badge">7 days</span>
            </div>

            @if (weekTotal() > 0) {
              <div class="chart">
                @for (d of week(); track d.key) {
                  <div class="chart-column">
                    <div class="bar-area">
                      <span class="bar-value">{{ d.total }}</span>
                      <div
                        class="chart-bar"
                        [class.today-bar]="d.key === date()"
                        [style.height.%]="d.pct"
                        [title]="d.total + ' requests'"
                      ></div>
                    </div>
                    <span class="chart-label">{{ d.label }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty">
                <span class="empty-icon">▥</span>
                <p>No appointment requests in this period.</p>
              </div>
            }
          </article>

          <article class="panel overview-panel">
            <div class="panel-header">
              <div>
                <h2>Request Overview</h2>
                <p>Requests received on selected date</p>
              </div>
              <span class="overview-icon">◎</span>
            </div>

            <div class="overview-number">{{ receivedStats().total }}</div>
            <p class="overview-caption">Total requests received</p>

            <div class="overview-divider"></div>

            <div class="overview-row">
              <span><i class="legend-dot pending-dot"></i>Pending</span>
              <strong>{{ receivedStats().pending }}</strong>
            </div>

            <div class="overview-row">
              <span><i class="legend-dot confirmed-dot"></i>Confirmed</span>
              <strong>{{ receivedStats().confirmed }}</strong>
            </div>

            <div class="overview-row">
              <span><i class="legend-dot cancelled-dot"></i>Cancelled</span>
              <strong>{{ receivedStats().cancelled }}</strong>
            </div>

            <div class="overview-divider"></div>

            <div class="all-time-row">
              <span>All-time appointments</span>
              <strong>{{ allStats().total }}</strong>
            </div>
          </article>
        </section>

        <section class="panel appointments-panel">
          <div class="panel-header table-heading">
            <div>
              <h2>Scheduled Appointments</h2>
              <p>{{ todayList().length }} appointments for {{ date() }}</p>
            </div>
            <span class="table-date">{{ date() }}</span>
          </div>

          <div class="table-toolbar">
            <label class="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search name, phone or service..."
                [ngModel]="search()"
                (ngModelChange)="search.set($event)"
              />
            </label>

            <select
              aria-label="Filter appointments by status"
              [ngModel]="statusFilter()"
              (ngModelChange)="statusFilter.set($event)"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="table-scroll">
            <table class="appointments-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Time</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>Branch</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                @for (a of filteredList(); track a._id) {
                  <tr>
                    <td>
                      <div class="customer-cell">
                        <span class="avatar">{{ initials(a.name) }}</span>
                        <strong>{{ a.name }}</strong>
                      </div>
                    </td>
                    <td class="time-cell">{{ a.time }}</td>
                    <td>{{ a.phone }}</td>
                    <td>{{ a.service }}</td>
                    <td>{{ a.branch }}</td>
                    <td>
                      <span [class]="'status-badge ' + a.status">
                        <i></i>{{ a.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">
                      <div class="table-empty">
                        <span>▤</span>
                        <strong>No appointments found</strong>
                        <p>Try another search, status or date.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <span>
              Showing {{ filteredList().length }} of
              {{ todayList().length }} appointments
            </span>

            @if (search() || statusFilter() !== 'all') {
              <button
                type="button"
                class="clear-btn"
                (click)="clearFilters()"
              >
                Clear filters
              </button>
            }
          </footer>
        </section>
      }
    </main>
  `,
  styles: [`
    :host {
  display: block;
  width: 100%;
  min-width: 0;
  color: #2D1721;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

.dashboard {
  --primary: #B3265B;
  --muted: #8B7580;
  --border: #EEDCE4;

  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: 12px;
  background: #FAF4F7;
  overflow-x: clip;
}

/* Page heading */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin: 0 0 24px;
}

.page-heading {
  flex: 1 1 260px;
  min-width: 0;
}

.eyebrow {
  display: inline-block;
  color: var(--primary);
  font-size: 10px;
  letter-spacing: 1.8px;
  font-weight: 800;
}

h1 {
  margin: 7px 0;
  color: #2D1721;
  font-size: clamp(25px, 3vw, 32px);
  line-height: 1.2;
  letter-spacing: -1px;
  font-weight: 750;
}

.page-subtitle,
.panel-header p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.date-control {
  display: grid;
  gap: 6px;
  color: #8B7580;
  font-size: 11px;
  font-weight: 600;
}

.date-control input,
.table-toolbar select {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #FFFFFF;
  color: #2D1721;
  font: inherit;
  outline: none;
}

.date-control input:focus,
.search-box:focus-within,
.table-toolbar select:focus {
  border-color: #B3265B;
  box-shadow: 0 0 0 3px #B3265B17;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #FFFFFF;
  color: #2D1721;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #FBEFF3;
  border-color: #E6B8CC;
}

.refresh-btn:disabled {
  opacity: .6;
  cursor: wait;
}

.refresh-btn span {
  font-size: 19px;
  line-height: 1;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Statistics cards */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  gap: 18px;
  margin: 0 0 24px;
  padding: 0;
}

.stat-card,
.panel {
  min-width: 0;
  border: 1px solid #EEDCE4;
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 3px 14px #2D172108;
}

.stat-card {
  display: flex;
  flex-direction: column;
  padding: 22px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat-label {
  color: #765563;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.stat-icon {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
}

/* Purple replaced with brand rose pink */

.purple {
  color: #B3265B;
  background: #FBEAF1;
}

.amber {
  color: #C68A17;
  background: #FFF5DC;
}

.green {
  color: #239A6A;
  background: #E6F8EF;
}

.red {
  color: #D94F66;
  background: #FFF0F2;
}

.stat-value {
  margin: 20px 0 16px;
  color: #2D1721;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -1.3px;
  font-weight: 750;
}

.stat-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  margin-top: auto;
  color: #8B7580;
  font-size: 10px;
  line-height: 1.5;
}

.status-dot,
.legend-dot,
.status-badge i {
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.purple-dot {
  background: #B3265B;
}

.pending-dot {
  background: #E9A82E;
}

.confirmed-dot {
  background: #24A477;
}

.cancelled-dot {
  background: #E36B7C;
}

/* Analytics and request overview */

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
  align-items: stretch;
  gap: 20px;
  margin: 0 0 24px;
  padding: 0;
}

.panel {
  align-self: stretch;
  padding: 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 24px;
}

.panel-header > div {
  min-width: 0;
}

.panel-header h2 {
  margin: 0 0 6px;
  color: #2D1721;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.4;
}

.period-badge {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 8px;
  background: #FBEAF1;
  color: #B3265B;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Seven-day chart */

.chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  height: 205px;
  min-height: 205px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.bar-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 0;
}

.bar-value {
  color: #765563;
  font-size: 11px;
  font-weight: 700;
}

.chart-bar {
  width: min(35px, 75%);
  min-height: 4px;
  border-radius: 7px 7px 2px 2px;
  background: #EED0DD;
  transition: height .25s ease;
}

.chart-bar.today-bar {
  background: #B3265B;
}

.chart-label {
  margin-top: 12px;
  color: #8B7580;
  font-size: 10px;
  white-space: nowrap;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 190px;
  text-align: center;
  color: #8B7580;
}

.empty-icon {
  color: #B3265B;
  font-size: 28px;
}

.chart-empty p {
  margin: 0;
  font-size: 12px;
}

/* Request overview */

.overview-icon {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FBEAF1;
  color: #B3265B;
  font-size: 23px;
}

.overview-number {
  color: #2D1721;
  font-size: 35px;
  font-weight: 750;
  letter-spacing: -1px;
  line-height: 1.2;
}

.overview-caption {
  margin: 5px 0 20px;
  color: var(--muted);
  font-size: 12px;
}

.overview-divider {
  height: 1px;
  margin: 16px 0;
  background: #F1E1E8;
}

.overview-row,
.all-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overview-row {
  margin: 15px 0;
  font-size: 12px;
}

.overview-row > span {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #765563;
}

.overview-row strong,
.all-time-row strong {
  color: #2D1721;
  font-size: 13px;
}

.all-time-row {
  color: #765563;
  font-size: 11px;
}

/* Appointments table */

.appointments-panel {
  padding: 0;
  overflow: hidden;
}

.table-heading {
  margin: 0;
  padding: 24px 24px 0;
}

.table-date {
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #765563;
  font-size: 11px;
  white-space: nowrap;
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 18px 24px;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  gap: 10px;
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #FFFFFF;
  transition: border-color .2s, box-shadow .2s;
}

.search-box > span {
  flex: 0 0 auto;
  color: #8B7580;
  font-size: 22px;
  line-height: 1;
}

.search-box input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #2D1721;
  font: inherit;
  font-size: 12px;
}

.search-box input::placeholder {
  color: #A18D97;
}

.table-toolbar select {
  flex: 0 0 160px;
  width: 160px;
  cursor: pointer;
  font-size: 12px;
}

.table-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}

.appointments-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}

.appointments-table th {
  padding: 14px 18px;
  background: #FBEFF3;
  color: #765563;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.appointments-table th:first-child,
.appointments-table td:first-child {
  padding-left: 24px;
}

.appointments-table th:last-child,
.appointments-table td:last-child {
  padding-right: 24px;
}

.appointments-table td {
  padding: 15px 18px;
  border-bottom: 1px solid #F1E1E8;
  color: #765563;
  font-size: 12px;
}

.appointments-table tbody tr:last-child td {
  border-bottom: 0;
}

.appointments-table tbody tr:hover {
  background: #FFFAFC;
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-cell strong {
  color: #2D1721;
  font-size: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: #FBEAF1;
  color: #B3265B;
  font-size: 11px;
  font-weight: 800;
}

.time-cell {
  color: #2D1721 !important;
  font-weight: 700;
}

/* Status colors remain distinct */

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #FFF5DF;
  color: #B47B11;
}

.status-badge.confirmed {
  background: #E7F8EF;
  color: #198458;
}

.status-badge.cancelled {
  background: #FFF0F2;
  color: #CF4C63;
}

.status-badge.pending i {
  background: #E9A82E;
}

.status-badge.confirmed i {
  background: #24A477;
}

.status-badge.cancelled i {
  background: #E36B7C;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 15px 24px;
  border-top: 1px solid #F1E1E8;
  color: #8B7580;
  font-size: 11px;
}

.clear-btn {
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: #B3265B;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.clear-btn:hover {
  text-decoration: underline;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 38px 12px;
  text-align: center;
  color: #8B7580;
}

.table-empty > span {
  color: #B3265B;
  font-size: 28px;
}

.table-empty strong {
  margin-top: 10px;
  color: #2D1721;
  font-size: 13px;
}

.table-empty p {
  margin: 6px 0 0;
  font-size: 12px;
}

/* Loading and error states */

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  padding: 24px;
  border: 1px solid #EEDCE4;
  border-radius: 16px;
  background: #FFFFFF;
  text-align: center;
  color: #8B7580;
}

.state-card h3 {
  margin: 12px 0 0;
  color: #2D1721;
  font-size: 14px;
}

.state-card p {
  margin: 6px 0 0;
  font-size: 12px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #F5E5ED;
  border-top-color: #B3265B;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
  padding: 17px;
  border: 1px solid #F0C8D5;
  border-radius: 12px;
  background: #FFF7F9;
  color: #A91F50;
}

.error-banner strong {
  font-size: 13px;
}

.error-banner p {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.5;
}

.error-banner button {
  flex: 0 0 auto;
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  background: #B3265B;
  color: #FFFFFF;
  cursor: pointer;
  font-size: 11px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Medium screens */

@media (max-width: 1100px) {
  .dashboard {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .content-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .analytics-panel,
  .overview-panel {
    width: 100%;
  }
}

/* Tablets and mobile */

@media (max-width: 600px) {
  .dashboard {
    padding: 15px;
  }

  .page-header {
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 20px;
  }

  .page-heading {
    flex-basis: 100%;
  }

  .header-actions {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
  }

  .date-control {
    flex: 1 1 auto;
    min-width: 0;
  }

  .date-control input {
    width: 100%;
    min-width: 0;
  }

  .refresh-btn {
    flex: 0 0 auto;
    padding: 0 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }

  .stat-card {
    padding: 15px 12px;
    border-radius: 12px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-icon {
    flex-basis: 31px;
    width: 31px;
    height: 31px;
    border-radius: 9px;
    font-size: 17px;
  }

  .stat-value {
    margin: 17px 0 13px;
    font-size: 28px;
  }

  .stat-footer {
    align-items: flex-start;
    font-size: 9px;
  }

  .content-grid {
    gap: 16px;
    margin-bottom: 18px;
  }

  .panel {
    padding: 17px;
    border-radius: 13px;
  }

  .panel-header {
    gap: 10px;
    margin-bottom: 20px;
  }

  .panel-header h2 {
    font-size: 14px;
  }

  .panel-header p {
    font-size: 11px;
  }

  .chart {
    height: 190px;
    min-height: 190px;
    gap: 5px;
  }

  .chart-label {
    font-size: 9px;
  }

  .appointments-panel {
    padding: 0;
  }

  .table-heading {
    padding: 18px 16px 0;
  }

  .table-date {
    padding: 7px;
    font-size: 10px;
  }

  .table-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    padding: 15px 16px;
  }

  .search-box {
    flex: 0 0 42px;
    width: 100%;
    min-width: 0;
  }

  .table-toolbar select {
    flex: 0 0 42px;
    width: 100%;
  }

  .appointments-table th:first-child,
  .appointments-table td:first-child {
    padding-left: 16px;
  }

  .appointments-table th:last-child,
  .appointments-table td:last-child {
    padding-right: 16px;
  }

  .appointments-table th,
  .appointments-table td {
    padding: 13px 14px;
  }

  .table-footer {
    padding: 13px 16px;
  }

  .overview-number {
    font-size: 32px;
  }
}

@media (max-width: 360px) {
  .dashboard {
    padding: 10px;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-card {
    padding: 12px 9px;
  }

  .stat-label {
    font-size: 9px;
  }

  .stat-icon {
    flex-basis: 28px;
    width: 28px;
    height: 28px;
  }

  .stat-value {
    font-size: 25px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .panel {
    padding: 13px;
  }

  .appointments-panel {
    padding: 0;
  }

  .table-heading {
    padding: 16px 12px 0;
  }

  .table-toolbar {
    padding: 13px 12px;
  }

  .table-footer {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}

  `]
})
export class DashboardPage {
  private readonly api = inject(SalonApiService);

  readonly all = signal<Appointment[]>([]);
  readonly date = signal(ymd(new Date()));
  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly scheduled = computed(() =>
    this.all().filter(a => a.date === this.date())
  );

  readonly received = computed(() =>
    this.all().filter(a => dayOf(a.createdAt) === this.date())
  );

  readonly selectedStats = computed(() => count(this.scheduled()));
  readonly receivedStats = computed(() => count(this.received()));
  readonly allStats = computed(() => count(this.all()));

  readonly todayList = computed(() =>
    [...this.scheduled()].sort((a, b) => a.time.localeCompare(b.time))
  );

  readonly filteredList = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.todayList().filter(a => {
      const matchesSearch = !term || [
        a.name,
        a.phone,
        a.service,
        a.branch
      ].some(value =>
        String(value ?? '').toLowerCase().includes(term)
      );

      return matchesSearch &&
        (status === 'all' || a.status === status);
    });
  });

  readonly week = computed(() => {
    const base = new Date(`${this.date()}T00:00:00`);

    const rows = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - (6 - i));

      const key = ymd(d);
      const total = this.all().filter(
        a => dayOf(a.createdAt) === key
      ).length;

      return {
        key,
        total,
        label: d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric'
        })
      };
    });

    const max = Math.max(1, ...rows.map(row => row.total));

    return rows.map(row => ({
      ...row,
      pct: row.total === 0 ? 2 : (row.total / max) * 85
    }));
  });

  readonly weekTotal = computed(() =>
    this.week().reduce((sum, day) => sum + day.total, 0)
  );

  constructor() {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getAppointments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: appointments => this.all.set(appointments),
        error: err => {
          console.error('Dashboard appointments error:', err);
          this.error.set(
            'Please check your connection and try loading the data again.'
          );
        }
      });
  }

  initials(name: string): string {
    return (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
  }
}
