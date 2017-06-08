//Remember to save the npm install of ava
import test from 'ava';
import webdriver from 'selenium-webdriver';
const prole = require('./prole-test');

test.beforeEach(async t => {
  t.context.driver = await prole.driver({
      options:{
        strict: true
      },
      cacheFile:'segmentTest'
    });
});

test('Check for user log-in', async t => {
      let driver = t.context.driver;
      await prepareCompass(driver);
      t.is(await driver.findElement(webdriver.By.xpath('//*[@id="lo-1"]/div/ul/li[1]')).getText(), "aperture_user");
      await driver.quit();
});

test('Segment List populates', async t => {
      let driver = t.context.driver;
      await prepareCompass(driver);
      await driver.get('http://localhost:9000/#audiences/segments');
      await driver.wait(webdriver.until.elementLocated(webdriver.By.className('strand-grid-item')), 10000);
      t.truthy(await driver.executeScript("return document.getElementById('list-of-segments').data.length;"));
      await driver.quit();
});

test('Segment Saves in Strict Mode', async t => {
      let driver = t.context.driver;
      await prepareCompass(driver)
      await driver.get('http://localhost:9000/#audiences/segments/adaptive/create');
      await driver.sleep('2000');
      await driver.wait(webdriver.until.elementLocated(webdriver.By.id('advertisers')), 10000);
      await driver.findElement(webdriver.By.css('#segment-name-wc input')).sendKeys('test segment'); //Fill in name
      await driver.executeScript("return document.getElementById('advertisers').open()"); //open advertisers
      await driver.executeScript("return document.querySelector('#middle > div:nth-child(1)').click()"); //open advertisers
      await driver.findElement(webdriver.By.id('add-behavior-button')).click(); //Click add behavior
      await driver.findElement(webdriver.By.css('tr:nth-child(5) > td:nth-child(2) > span')).click(); //Expand Event pixels
      await driver.findElement(webdriver.By.css('tr:nth-child(6) > td:nth-child(2) > span')).click(); //Select first pixel
      await driver.findElement(webdriver.By.id('add-button')).click(); //Click Apply
      await driver.findElement(webdriver.By.id('save-segment-button')).click(); //Click Save
      await driver.sleep('500'); //Allow for page redirect
      let footerText = await driver.wait(webdriver.until.elementLocated(webdriver.By.id('messageBox')));
      t.is(await footerText.getText(), "Save Successful");
      await driver.quit();
});

async function prepareCompass(driver) {
      await driver.navigate().refresh();
      await driver.navigate().refresh();
      await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath('//*[@id="lo-1"]/div/ul/li[1]')), 5000);
}
