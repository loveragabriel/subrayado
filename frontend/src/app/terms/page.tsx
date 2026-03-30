'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const content = {
  es: {
    title: 'Términos y Condiciones de Uso',
    updated: 'Última actualización: marzo 2026',
    sections: [
      {
        heading: '1. Responsabilidad del contenido',
        body: 'Los usuarios son los únicos responsables del contenido que cargan en la plataforma, incluyendo archivos PDF y ePub. Subrayado no almacena permanentemente los archivos — estos se alojan en servicios de terceros (Cloudinary) y son responsabilidad exclusiva de quien los sube.',
      },
      {
        heading: '2. Propiedad intelectual',
        body: 'Al cargar un archivo, el usuario declara tener los derechos necesarios para compartirlo. Subrayado no se responsabiliza por infracciones de derechos de autor. Te recomendamos usar únicamente materiales de dominio público, con licencia Creative Commons, o de tu propia autoría.',
      },
      {
        heading: '3. Uso aceptable',
        body: 'La plataforma está diseñada para compartir conocimiento con fines educativos y culturales. Queda prohibido cargar contenido ilegal, ofensivo o que viole derechos de terceros.',
      },
      {
        heading: '4. Limitación de responsabilidad',
        body: 'Subrayado es una herramienta de facilitación. No somos responsables por el uso que los usuarios hagan de los materiales compartidos dentro de la plataforma.',
      },
    ],
    back: '← Volver al inicio',
    switchLang: 'EN',
  },
  en: {
    title: 'Terms and Conditions of Use',
    updated: 'Last updated: March 2026',
    sections: [
      {
        heading: '1. Content Responsibility',
        body: 'Users are solely responsible for the content they upload to the platform, including PDF and ePub files. Subrayado does not permanently store uploaded files — they are hosted by third-party services (Cloudinary) and remain the exclusive responsibility of the person who uploads them.',
      },
      {
        heading: '2. Intellectual Property',
        body: 'By uploading a file, the user declares they have the necessary rights to share it. Subrayado is not responsible for copyright infringement. We recommend using only public domain materials, Creative Commons licensed content, or your own original work.',
      },
      {
        heading: '3. Acceptable Use',
        body: 'The platform is designed for sharing knowledge for educational and cultural purposes. Uploading illegal, offensive, or content that violates third-party rights is strictly prohibited.',
      },
      {
        heading: '4. Limitation of Liability',
        body: 'Subrayado is a facilitation tool. We are not responsible for how users interact with or use materials shared within the platform.',
      },
    ],
    back: '← Back to home',
    switchLang: 'ES',
  },
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function TermsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'es'
  const t = content[lang]
  const otherLang = lang === 'es' ? 'en' : 'es'

  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-10">
          <Link
            href={`/?lang=${lang}`}
            className="text-sm text-blue-600 hover:text-blue-800 transition"
          >
            {t.back}
          </Link>
          <button
            onClick={() => router.replace(`/terms?lang=${otherLang}`)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition text-sm font-medium"
            aria-label="Switch language"
          >
            <GlobeIcon />
            <span>{t.switchLang}</span>
          </button>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.title}</h1>
        <p className="text-sm text-slate-400 mb-12">{t.updated} · Subrayado</p>

        <div className="space-y-8">
          {t.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-slate-800 mb-2">{section.heading}</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100">
          <Link
            href={`/?lang=${lang}`}
            className="text-sm text-blue-600 hover:text-blue-800 transition"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TermsContent />
    </Suspense>
  )
}
