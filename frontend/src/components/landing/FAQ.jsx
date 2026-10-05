import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Apa itu SIGAP?',
    answer: 'SIGAP (Sistem Informasi & Gangguan Pelayanan Publik) adalah platform pelaporan publik terkoneksi yang memudahkan warga menyampaikan kendala infrastruktur jalan dan kelalulintasan langsung ke instansi dan petugas lapangan terkait.',
  },
  {
    question: 'Siapa saja yang bisa membuat laporan di SIGAP?',
    answer: 'Seluruh warga yang telah mendaftarkan akun di SIGAP dengan NIK yang valid dapat membuat laporan kendala fasilitas umum.',
  },
  {
    question: 'Jenis gangguan apa saja yang dapat dilaporkan?',
    answer: 'Kamu dapat melaporkan masalah lalu lintas dan infrastruktur seperti jalan berlubang, lampu lalu lintas (traffic light) mati, rambu rusak, genangan air yang mengganggu akses jalan, hingga kerusakan penerangan jalan umum (PJU).',
  },
  {
    question: 'Apakah laporan saya dijamin akan ditindaklanjuti?',
    answer: 'Setiap laporan yang masuk akan ditinjau oleh Tim Verifikator. Jika laporan dinyatakan layak dan valid, laporan langsung ditugaskan kepada unit petugas lapangan untuk penanganan bertahap yang dapat kamu pantau hingga selesai.',
  },
  {
    question: 'Bagaimana peran AI di dalam SIGAP?',
    answer: 'AI bertindak sebagai asisten pembantu Verifikator untuk membuat ringkasan laporan serta memberikan usulan kategori dan tingkat prioritas. Keputusan akhir persetujuan laporan sepenuhnya tetap ditentukan oleh manusia (Verifikator).',
  },
  {
    question: 'Bagaimana cara melacak perkembangan status laporan?',
    answer: 'Setelah masuk ke akun kamu, buka halaman "Laporan Saya". Di sana terdapat linimasa status pelacakan real-time mulai dari Menunggu Verifikasi, Terverifikasi, Ditugaskan ke Petugas, hingga Selesai Ditangani beserta bukti foto pengerjaan.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-surface border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> Pertanyaan Umum
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
            Pertanyaan Yang Sering Diajukan
          </h2>
          <p className="mt-4 text-base md:text-lg text-ink-soft">
            Temukan jawaban atas pertanyaan umum seputar penggunaan platform SIGAP.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-background rounded-xl border border-border overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-ink hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-ink-soft shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm md:text-base text-ink-soft border-t border-border/40 leading-relaxed">
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
