const Selectors = require('../selectors');

module.exports = function (app) {
  async function navigateToCollection(dbName, collectionName) {
    const { client } = app;

    const headerSelector = Selectors.collectionHeaderTitle(
      dbName,
      collectionName
    );
    const collectionSelector = Selectors.sidebarCollection(
      dbName,
      collectionName
    );

    const headerElement = await client.$(headerSelector);

    // Close all the collection tabs to get rid of all the state we might have accumulated. This is the only way to get back to the zero state of Schema, Explain Plan and Validation tabs without re-connecting.
    await client.closeCollectionTabs();

    // search for the collection and wait for the collection to be there and visible
    await client.clickVisible(Selectors.SidebarFilterInput);
    const sidebarFilterInputElement = await client.$(
      Selectors.SidebarFilterInput
    );
    await sidebarFilterInputElement.setValue(collectionName);
    const collectionElement = await client.$(collectionSelector);
    await collectionElement.waitForDisplayed();

    // click it and wait for the collection header to become visible
    await client.clickVisible(collectionSelector);
    await headerElement.waitForDisplayed();
  }

  return async function navigateToCollectionTab(
    dbName,
    collectionName,
    tabName
  ) {
    const { client } = app;

    const tabSelector = Selectors.collectionTab(tabName);
    const tabSelectedSelector = Selectors.collectionTab(tabName, true);

    await navigateToCollection(dbName, collectionName);

    const tabSelectedSelectorElement = await client.$(tabSelectedSelector);
    // if the correct tab is already visible, do nothing
    if (await tabSelectedSelectorElement.isExisting()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await client.clickVisible(tabSelector);

    await tabSelectedSelectorElement.waitForDisplayed();
  };
};
