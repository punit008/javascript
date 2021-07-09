const puppeteer = require('puppeteer')

async function getPic() {
    try {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()

        // Login 
        await page.goto('https://www.vardaam.com/wp-admin', { waitUntil: 'networkidle0' })
        await page.screenshot({ path: 'login-page.png' });
        await page.type('input[name=log]', 'developer')
        await page.type('input[name=pwd]', '!LyG53rhjvsq&f1jpZjD4SdB')
        await page.click('#wp-submit')
        await page.waitForNavigation()

        // If wp-admin login detail is wrong
        if (await page.$('#login #login_error') !== null) {
            console.log('Your username or password is incorrect.')
            return browser.close()
        }

        // If plugin already installed or not
        await page.goto('https://www.vardaam.com/wp-admin/plugins.php')
        await page.screenshot({ path: 'plugin-list.png', fullPage: true })
        if (await page.$('#the-list .inactive[data-slug=wp-sites-manager]') !== null) {
            console.log('Plugin already installed but inactive');
            return browser.close()
        } else if (await page.$('#the-list .active[data-slug=wp-sites-manager]') !== null) {
            console.log('Plugin already installed and active');
            return browser.close()
        } else {

            // Install plugin
            await page.goto('https://www.vardaam.com/wp-admin/plugin-install.php')

            // Check if there is ftp credential issue
            if (await page.$('[aria-labelledby="request-filesystem-credentials-title"]') !== null) {
                console.log('Ftp credential issue')
                return browser.close()
            }

            // Check if upload plugin button not found
            if (await page.$('.upload-view-toggle') === null) {

                console.log('Upload plugin button not found. Wordpress version may be older.')
                return browser.close()

            } else {

                await page.click('.upload-view-toggle')
                await page.waitForSelector('input[name=pluginzip]')
                const inputUploadHandle = await page.$('input[name=pluginzip]')
                let fileToUpload = 'wpsitesplugin.zip'
                // let fileToUpload = 'testing.zip'

                // Plugin extenstion is .zip or not
                if (fileToUpload.split('.').pop() !== 'zip') {

                    console.log('file extenstion is not a zip file')
                    return browser.close()

                } else {

                    await inputUploadHandle.uploadFile(fileToUpload)
                    await page.click('#install-plugin-submit')
                    await page.waitForNavigation()

                    // Not able to create directory error
                    if (await page.$('.wp-die-message') !== null) {
                        let element = await page.$('.wp-die-message')
                        let value = await page.evaluate(el => el.textContent, element)
                        console.log('Permission error: ' + value)
                        return browser.close()
                    }

                    // Plugin installation failed or not
                    await page.waitForSelector('#wpbody-content .wrap')
                    let element = await page.$('#wpbody-content .wrap')
                    let value = await page.evaluate(el => el.textContent, element)
                    let matchValue = 'The package could not be installed. No valid plugins were found.'

                    if (matchString(value, matchValue)) {
                        console.log("The package could not be installed. No valid plugins were found.")
                        await page.screenshot({ path: 'installation-failed.png', fullPage: true });
                        return browser.close()
                    } else {
                        await page.click('a.button.button-primary')
                        await page.waitForNavigation()
                        await page.screenshot({ path: 'vardaam.png' });

                        if (await page.$('#the-list .active[data-slug=wp-sites-manager]') !== null) {
                            console.log('installed successfully');
                        } else {
                            console.log('Installation failed');
                        }
                    }
                }

                // await page.pdf({ format: 'A4', path: 'vardaam.pdf' })
            }

        }

        await browser.close()
    } catch (error) {
        console.log(error);
        await browser.close()
    }
    console.log('done')
}


/**
 * Function to match string from give a value and return true or false
 * 
 * @param any value
 * @param any matchValue
 * @return boolean 
*/

function matchString(value, matchValue) {
    var string = value;
    var result = string.match(matchValue);
    if (result != null)
        return true;
}

getPic();
