const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (app) {
  return async function waitForConnectionScreen() {
    const { client } = app;
    await client.waitUntil(
      async () => {
        // Compass starts with two windows (one is loading, another is main)
        // and then one of them is closed. To make sure we are always checking
        // against existing window, we "focus" the first existing one every
        // time we run the check (spectron doesn't do it for you automatically
        // and will fail when certain methods are called on closed windows)
        await client.windowByIndex(0);
        const connectScreenElement = await client.$(Selectors.ConnectSection);
        return await connectScreenElement.isDisplayed();
      },
      {
        timeout: MINUTE,
        timeoutMsg: 'Expected connection screen to be visible',
        interval: 50,
      }
    );
  };
};
