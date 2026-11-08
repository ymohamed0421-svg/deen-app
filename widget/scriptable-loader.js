// Deen: next prayer widget. Paste this whole script into the free Scriptable app.
// Change the next two lines to match the Prayer tab in Deen if you picked something else there.
const METHOD = 'MuslimWorldLeague' // or NorthAmerica, Egyptian, UmmAlQura, Karachi, Dubai, Qatar, Kuwait, Singapore, Turkey, Tehran, MoonsightingCommittee
const MADHAB = 'shafi' // 'shafi' for Shafi'i, Maliki and Hanbali Asr, or 'hanafi'

const SOURCE = 'https://ymohamed0421-svg.github.io/deen-app/widget/next-prayer.js'
const fm = FileManager.local()
const saved = fm.joinPath(fm.documentsDirectory(), 'deen-next-prayer.js')
try {
  const code = await new Request(SOURCE).loadString()
  if (code.includes('DEEN_WIDGET')) fm.writeString(saved, code)
} catch (e) {}
if (!fm.fileExists(saved)) throw new Error('Connect to the internet and run this script once.')
const run = new Function('settings', fm.readString(saved) + '\nreturn deenWidget(settings)')
await run({ method: METHOD, madhab: MADHAB })
