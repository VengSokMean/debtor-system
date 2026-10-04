import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DebtorService } from './services/debtor.service';
import { Debtor } from './models/debtor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  // =========================
  // DATA
  // =========================

  debtors: Debtor[] = [];

  search = '';
  filter = 'all';

  showForm = false;
  editing = false;
  loading = true;

  error = '';

  form: Debtor = this.blank();

  // =========================
  // LANGUAGE
  // =========================

  language: 'en' | 'km' = 'en';

  constructor(private api: DebtorService) {}

  // =========================
  // START
  // =========================

  ngOnInit(): void {

    const savedLanguage =
      localStorage.getItem('language');

    if (
      savedLanguage === 'en' ||
      savedLanguage === 'km'
    ) {
      this.language = savedLanguage;
    }

    this.load();
  }

  // =========================
  // LANGUAGE
  // =========================

  setLanguage(lang: 'en' | 'km'): void {

    this.language = lang;

    localStorage.setItem(
      'language',
      lang
    );
  }

  // =========================
  // TRANSLATE
  // =========================

  t(en: string, km: string): string {

    return this.language === 'km'
      ? km
      : en;
  }

  // =========================
  // STATUS TRANSLATION
  // =========================

  statusText(
    status: 'paid' | 'unpaid' | 'overdue'
  ): string {

    if (status === 'paid') {

      return this.t(
        'Paid',
        'បានសង'
      );
    }

    if (status === 'overdue') {

      return this.t(
        'Overdue',
        'ហួសកំណត់'
      );
    }

    return this.t(
      'Unpaid',
      'មិនទាន់សង'
    );
  }

  // =========================
  // EMPTY FORM
  // =========================

  blank(): Debtor {

    return {
      name: '',
      amount: 0,
      currency: 'USD',

      owedDate:
        new Date()
          .toISOString()
          .slice(0, 10),

      dueDate: '',

      note: '',

      status: 'unpaid',

      paidDate: null,

      invoiceNumber: '',
      invoiceName: '',
      invoiceData: ''
    };
  }

  // =========================
  // LOAD DEBTORS
  // =========================

  load(): void {

    this.loading = true;

    this.api.list().subscribe({

      next: (data: Debtor[]) => {

        this.debtors = data;

        this.loading = false;

        this.error = '';
      },

      error: (err) => {

        console.error(
          'Load debtor error:',
          err
        );

        this.loading = false;

        this.error = this.t(
          'Could not load debts. Check Netlify Dev and MongoDB settings.',
          'មិនអាចទាញយកទិន្នន័យបំណុលបាន។ សូមពិនិត្យ Netlify Dev និង MongoDB។'
        );
      }
    });
  }

  // =========================
  // SEARCH + FILTER
  // =========================

  get filtered(): Debtor[] {

    return this.debtors.filter(
      (d: Debtor) => {

        const searchMatch =
          d.name
            .toLowerCase()
            .includes(
              this.search
                .toLowerCase()
            );

        const statusMatch =
          this.filter === 'all' ||
          this.state(d) === this.filter;

        return (
          searchMatch &&
          statusMatch
        );
      }
    );
  }

  // =========================
  // TOTAL USD
  // =========================

  get usd(): number {

    return this.debtors
      .filter(
        (d: Debtor) =>
          d.status === 'unpaid' &&
          d.currency === 'USD'
      )
      .reduce(
        (
          total: number,
          d: Debtor
        ) =>
          total +
          Number(d.amount),
        0
      );
  }

  // =========================
  // TOTAL KHR
  // =========================

  get khr(): number {

    return this.debtors
      .filter(
        (d: Debtor) =>
          d.status === 'unpaid' &&
          d.currency === 'KHR'
      )
      .reduce(
        (
          total: number,
          d: Debtor
        ) =>
          total +
          Number(d.amount),
        0
      );
  }

  // =========================
  // OPEN DEBT COUNT
  // =========================

  get openDebtCount(): number {

    return this.debtors.filter(
      (d: Debtor) =>
        d.status !== 'paid'
    ).length;
  }

  // =========================
  // STATUS
  // =========================

  state(
    d: Debtor
  ): 'paid' | 'unpaid' | 'overdue' {

    if (d.status === 'paid') {
      return 'paid';
    }

    if (
      d.dueDate &&
      new Date(
        d.dueDate + 'T23:59:59'
      ) < new Date()
    ) {
      return 'overdue';
    }

    return 'unpaid';
  }

  // =========================
  // OPEN FORM
  // =========================

  open(d?: Debtor): void {

    this.editing = !!d;

    if (d) {

      this.form = {
        ...d
      };

    } else {

      this.form =
        this.blank();
    }

    this.error = '';

    this.showForm = true;
  }

  // =========================
  // CLOSE FORM
  // =========================

  closeModal(): void {

    this.showForm = false;

    this.editing = false;

    this.error = '';

    this.form =
      this.blank();
  }

  // =========================
  // INVOICE
  // =========================

  invoiceSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    // FILE TYPE
    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      this.error = this.t(
        'Invoice must be PDF, JPG, PNG or WebP.',
        'វិក្កយបត្រត្រូវតែជា PDF, JPG, PNG ឬ WebP។'
      );

      input.value = '';

      return;
    }

    // FILE SIZE: MAXIMUM 2 MB
    if (
      file.size >
      2 * 1024 * 1024
    ) {

      this.error = this.t(
        'Invoice must be 2 MB or smaller.',
        'ឯកសារវិក្កយបត្រត្រូវមានទំហំ 2 MB ឬតូចជាងនេះ។'
      );

      input.value = '';

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      this.form.invoiceData =
        String(
          reader.result
        );

      this.form.invoiceName =
        file.name;

      this.error = '';
    };

    reader.onerror = () => {

      this.error = this.t(
        'Could not read invoice file.',
        'មិនអាចអានឯកសារវិក្កយបត្របាន។'
      );
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // REMOVE INVOICE
  // =========================

  removeInvoice(): void {

    this.form.invoiceData = '';

    this.form.invoiceName = '';
  }

  // =========================
  // SAVE / UPDATE
  // =========================

  save(): void {

    // NAME
    if (
      !this.form.name.trim()
    ) {

      this.error = this.t(
        'Please enter debtor name.',
        'សូមបញ្ចូលឈ្មោះអ្នកជំពាក់។'
      );

      return;
    }

    // AMOUNT
    if (
      Number(
        this.form.amount
      ) <= 0
    ) {

      this.error = this.t(
        'Please enter a valid amount.',
        'សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ។'
      );

      return;
    }

    // DEADLINE
    if (
      !this.form.dueDate
    ) {

      this.error = this.t(
        'Please select payment deadline.',
        'សូមជ្រើសរើសថ្ងៃកំណត់សងប្រាក់។'
      );

      return;
    }

    this.error = '';

    const request =
      this.editing
        ? this.api.update(
            this.form
          )
        : this.api.create(
            this.form
          );

    request.subscribe({

      next: () => {

        this.closeModal();

        this.load();
      },

      error: (err) => {

        console.error(
          'Save debtor error:',
          err
        );

        this.error =
          err?.error?.message ||
          this.t(
            'Could not save debt.',
            'មិនអាចរក្សាទុកបំណុលបាន។'
          );
      }
    });
  }

  // =========================
  // PAID / UNPAID
  // =========================

  paid(d: Debtor): void {

    const newStatus:
      'paid' | 'unpaid' =
      d.status === 'paid'
        ? 'unpaid'
        : 'paid';

    const updatedDebtor: Debtor = {

      ...d,

      status: newStatus,

      paidDate:
        newStatus === 'paid'
          ? new Date()
              .toISOString()
          : null
    };

    this.api
      .update(updatedDebtor)
      .subscribe({

        next: () => {

          this.error = '';

          this.load();
        },

        error: (err) => {

          console.error(
            'Update debtor error:',
            err
          );

          this.error =
            err?.error?.message ||
            this.t(
              'Could not change status.',
              'មិនអាចផ្លាស់ប្តូរស្ថានភាពបាន។'
            );
        }
      });
  }

  // =========================
  // DELETE
  // =========================

  del(d: Debtor): void {

    if (!d._id) {

      this.error = this.t(
        'Cannot delete debtor without ID.',
        'មិនអាចលុបអ្នកជំពាក់ដែលគ្មាន ID បាន។'
      );

      return;
    }

    const message =
      this.language === 'km'
        ? `តើអ្នកពិតជាចង់លុបបំណុលរបស់ ${d.name} មែនទេ?`
        : `Delete debt for ${d.name}?`;

    const confirmed =
      confirm(message);

    if (!confirmed) {
      return;
    }

    this.api
      .remove(d._id)
      .subscribe({

        next: () => {

          this.error = '';

          this.load();
        },

        error: (err) => {

          console.error(
            'Delete debtor error:',
            err
          );

          this.error =
            err?.error?.message ||
            this.t(
              'Could not delete debt.',
              'មិនអាចលុបបំណុលបាន។'
            );
        }
      });
  }
}