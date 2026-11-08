# Next prayer widget (iPhone, free)

A home screen widget that shows the next prayer, its time, and a live countdown.
It runs in the free [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app, so it needs no paid Apple account.

- `scriptable-loader.js` is the short script people paste into Scriptable.
- `next-prayer.js` is the widget itself. The web build (`scripts/web-finish.mjs`) puts the adhan library in front of it and publishes it at
  https://ymohamed0421-svg.github.io/deen-app/widget/next-prayer.js, so changes reach everyone's widget after the next deploy.

Times are worked out on the phone with adhan, the same library the app uses. Location comes from the phone and is remembered for when it isn't available.

## Setup on iPhone

1. Install **Scriptable** from the App Store (free).
2. Open Scriptable, tap **+**, paste the whole of `scriptable-loader.js`, and name it "Next prayer".
3. Tap ▶ once and allow location. A preview of the widget appears.
4. On the home screen, press and hold an empty spot, tap **Edit** then **Add Widget**, pick **Scriptable**, choose the small or medium size, and add it.
5. Press and hold the new widget, tap **Edit Widget**, and set **Script** to "Next prayer".
