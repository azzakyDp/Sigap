import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Icon from '../ui/Icon';

const faqs = [
  {
    question: 'Apa itu SIGAP?',
    answer: 'SIGAP (Sistem Pengaduan Gangguan Lalu Lintas) adalah platform pengaduan publik yang memudahkan warga melaporkan kendala infrastruktur jalan dan fasilitas lalu lintas secara terstruktur.',
  },
  {
    question: 'Siapa saja yang dapat membuat laporan pengaduan?',
    answer: 'Seluruh warga yang telah mendaftarkan akun SIGAP dengan format NIK (16 digit) yang valid dapat mengajukan laporan pengaduan.',
  },
  {
    question: 'Jenis gangguan apa saja yang dapat dilaporkan?',
    answer: 'Anda dapat melaporkan kendala lalu lintas dan infrastruktur seperti jalan berlubang, lampu lalu lintas (traffic light) padam, rambu rusak, genangan air yang menghambat jalan, serta kendala fasilitas penerangan umum.',
  },
  {
    question: 'Bagaimana alur penindaklanjutan laporan?',
    answer: 'Setiap laporan yang masuk akan diverifikasi oleh tim Verifikator resmi. Jika dinyatakan layak, laporan diteruskan kepada petugas lapangan untuk ditangani secara bertahap.',
  },
  {
    question: 'Bagaimana peran AI di dalam SIGAP?',
    answer: 'Modul AI bertindak sebagai asisten pendukung Verifikator untuk menyarikan isi pengaduan serta memberikan rekomendasi prioritas dan kategori. Keputusan verifikasi akhir sepenuhnya berada di tangan manusia (Verifikator).',
  },
  {
    question: 'Bagaimana cara memantau perkembangan laporan saya?',
    answer: 'Setelah masuk ke akun Anda, buka menu "Laporan Saya". Di sana Anda dapat melihat linimasa perkembangan status laporan dari tahap verifikasi hingga penyelesaian oleh petugas.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-surface border-t border-border/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            Pertanyaan Umum
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-ink tracking-tight">
            Pertanyaan Yang Sering Diajukan
          </h2>
          <p className="mt-3 text-sm md:text-base text-ink-soft">
            Informasi umum seputar alur pengaduan dan penggunaan platform SIGAP.
          </p>
        </div>

        {/* Clean Divider Accordion List */}
        <div className="border-y border-border/70 divide-y divide-border/60">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const contentId = `faq-content-${idx}`;
            const headerId = `faq-header-${idx}`;
            return (
              <div key={idx} className="py-4">
                <button
                  id={headerId}
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full text-left flex items-center justify-between gap-4 font-semibold text-ink hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 rounded-md py-1 cursor-pointer"
                >
                  <span className="text-sm md:text-base">{faq.question}</span>
                  <Icon
                    icon={ChevronDown}
                    size="sm"
                    className={`transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : 'text-ink-soft'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className="pt-3 pb-1 text-xs md:text-sm text-ink-soft leading-relaxed"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default FAQ;
