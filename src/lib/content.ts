import type { Settings } from './storage'

const words = {
  es: 'tiempo mundo camino lugar vida forma parte casa trabajo agua aire luz noche tarde libro mano idea persona historia ciudad espacio ritmo calma paso voz tierra cielo mar viento mirar pensar crear sentir aprender volver conocer hacer decir poder querer saber jugar abrir cerrar seguir crecer escribir leer color papel ventana memoria futuro presente momento sonido bosque piedra flor puente viaje siempre nunca cerca lejos juntos ahora antes luego mejor claro nuevo simple libre fuerte suave breve largo primer cada entre sobre desde hasta cuando donde como para porque aunque mientras nosotros alguien algo todo nada palabra teclado foco mente arte cambio origen detalle sentido pausa equilibrio estrella lluvia arena altura alegre movimiento encuentro horizonte descubrir imaginar construir compartir escuchar observar cuidar intentar avanzar respirar encontrar'.split(
    ' ',
  ),
  en: 'time world way place life form part home work water air light night morning book hand idea person story city space rhythm calm step voice earth sky sea wind look think create feel learn return know make say can want play open close follow grow write read color paper window memory future present moment sound forest stone flower bridge journey always never near far together now before later better clear new simple free strong soft short long first each between above from until when where how because although while someone something everything nothing word keyboard focus mind art change origin detail meaning pause balance star rain sand height happy movement meeting horizon discover imagine build share listen observe care try move breathe find through around small great other good day line begin point keep both most give take'.split(
    ' ',
  ),
}

const quotes = {
  es: [
    'Escribir bien no es correr hacia la \u00faltima palabra. Es encontrar un ritmo que deje espacio para pensar, corregir y volver a empezar.',
    'La constancia transforma los peque\u00f1os pasos en caminos largos. Hoy basta con prestar atenci\u00f3n a la siguiente letra.',
    'Hay ideas que llegan despacio, como la luz por una ventana. Dales tiempo, un poco de silencio y una p\u00e1gina donde quedarse.',
    'No necesitas hacerlo perfecto. Necesitas estar presente, escuchar tu ritmo y aprender algo nuevo de cada intento.',
  ],
  en: [
    'Good writing is not a race toward the last word. It is a rhythm that leaves room to think, make a correction, and begin again.',
    'Small steps become long journeys when you keep taking them. Today, all you need to do is pay attention to the next letter.',
    'Some ideas arrive slowly, like sunlight through a window. Give them time, a little quiet, and a page where they can stay.',
    'You do not need to be perfect. You need to be present, find your rhythm, and learn something new from every attempt.',
  ],
}

export const modeLabels: Record<Settings['mode'], string> = {
  time: 'Tiempo',
  words: 'Palabras',
  quote: 'Citas',
  zen: 'Zen',
  custom: 'Personalizado',
}

export function createText(
  settings: Settings,
  trainingWords: string[] = [],
  customText = '',
): { text: string; source?: string } {
  const reference = (text: string) =>
    settings.language === 'es' && settings.plainSpanish
      ? text.normalize('NFD').replace(/\p{M}/gu, '')
      : text
  if (settings.mode === 'zen') return { text: '' }
  if (settings.mode === 'custom')
    return {
      text: reference(customText.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 5000)),
    }
  if (settings.mode === 'quote' && !trainingWords.length) {
    const pool = quotes[settings.language]
    return {
      text: reference(pool[Math.floor(Math.random() * pool.length)]),
      source: 'Retype Original',
    }
  }
  const pool = trainingWords.length ? trainingWords : words[settings.language]
  const count = settings.mode === 'words' ? settings.wordCount : 250
  const output: string[] = []
  for (let index = 0; index < count; index++) {
    let word = pool[Math.floor(Math.random() * pool.length)]
    if (pool.length > 1 && word === output.at(-1))
      word = pool[(pool.indexOf(word) + 1) % pool.length]
    if (settings.numbers && index % 9 === 7) word = String(Math.floor(Math.random() * 999))
    if (settings.punctuation && index % 7 === 6) word += index % 2 ? ',' : '.'
    output.push(word)
  }
  return { text: reference(output.join(' ')) }
}
