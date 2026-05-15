import { test, expect } from "@playwright/test"
import { manageStaff } from "../page-objects/managestaff-page"
import testData from './test-data/staffTCData.json'


test.describe('Manage Staff', () => {

    let staffObj: manageStaff

    test.beforeEach(async ({ page }) => {
        staffObj = new manageStaff(page)
        await staffObj.loginPage(process.env.USERNAME!, process.env.PASSWORD!)
        await expect((page)).toHaveURL(/employee-management/) //check in correct page
        const btn_ = page.getByRole('button', { name: /Switch to classic UI/ }); // swtich to classic mode
        await btn_.waitFor({ state: 'visible' });
        await btn_.click();
        await page.waitForTimeout(3000);
    })

    //function to auto generate name and pin number
    const generateStaff = () => ({
        name: `User_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        pin: `${Math.floor(1000 + Math.random() * 9000)}`
    })



    test('TC01[Add]-staff with valid data', async () => {
        const user = generateStaff()
        const jsonData = testData.profile1
        const currentTotal = await staffObj.getCurrentTotalStaff()

        await staffObj.addStaff({ name: user.name, pin: user.pin, rate: jsonData.rate, tier: jsonData.tier, action: "confirm" })
        await expect(staffObj.getStaff(user.name)).toBeVisible({ timeout: 10000 })

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(currentTotal + 1)

        //only check name and tier because table only shown these 2 info
        await staffObj.checkStaffDetailsInTable({ name: user.name, tier: jsonData.tier })

        //clean up
        await staffObj.deleteStaff(user.name, "confirm")
    })

    test('TC02[Add]-Submit with all fields empty', async () => {

        const originalTotal = await staffObj.getCurrentTotalStaff()
        await staffObj.addStaff({ action: 'confirm' }) //direct click confirm without pass any data to fill up

        await staffObj.checkFieldError('Name', 'Please type something')
        await staffObj.closeModal("Add Staff")

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(originalTotal)
    })

    test('TC03[Add]- Add staff only on required fields', async () => {
        const staff = generateStaff()
        const currentTotal = await staffObj.getCurrentTotalStaff()

        await staffObj.addStaff({ name: staff.name, pin: staff.pin, action: 'confirm' } as any)
        await expect(staffObj.getStaff(staff.name)).toBeVisible({ timeout: 10000 })

        const latestTotal = await staffObj.getTotalStaff()
        expect(latestTotal).toBe(currentTotal + 1)

        await staffObj.checkStaffDetailsInTable({ name: staff.name, tier: undefined }) //check in table

        await staffObj.getStaff(staff.name).click()//select user from table
        await staffObj.verifySelectedStaff({ name: staff.name, pin: staff.pin, rate: "0", tier: undefined }) //by default rate=0,tier = empty

        await staffObj.closeModal("Edit Staff")
        await staffObj.deleteStaff(staff.name, "confirm")
    })

    test("TC04[Add]- Empty Name field or Empty PIN field (either one) ", async () => {

        const user = generateStaff()
        const currentTotal = await staffObj.getCurrentTotalStaff()

        // only name empty
        await staffObj.addStaff({ pin: user.pin, action: 'confirm' }) //pass pin only, name=empty
        await expect(await staffObj.checkFieldError("Name", "Please type something")).toBeVisible()//check error on name input
        await staffObj.staffPin.clear() //empty the pin input
        await staffObj.closeModal("Add Staff")// close dialog

        // only pin empty
        await staffObj.addStaff({ name: user.name, action: 'confirm' })//pass name only, pin=empty
        await expect(await staffObj.checkFieldError("Staff PIN", "PIN must contain exactly 4 digits")).toBeVisible()//check error on pin input
        await staffObj.staffName.clear()
        await staffObj.closeModal("Add Staff")

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toEqual(currentTotal)
    })

    test("TC05[Add] - Validate duplicate name and PIN", async () => {

        const user = generateStaff()
        const originalTotal = await staffObj.getCurrentTotalStaff()

        //add staff 1
        await staffObj.addStaff({ name: user.name, pin: user.pin, action: 'confirm' })
        await expect(staffObj.getStaff(user.name)).toBeVisible({ timeout: 10000 })

        //  add staff 2 name duplicate as staff 1
        await staffObj.addStaff({ name: user.name, pin: '9999', action: 'confirm' })
        await expect(await staffObj.checkFieldError("Name", "This name is already in use")).toBeVisible()//check error on name input
        await staffObj.closeModal("Add Staff")

        //  add staff with duplicate pin as staff 1
        await staffObj.addStaff({ name: generateStaff().name, pin: user.pin, action: 'confirm' })
        await expect(await staffObj.checkFieldError("Staff PIN", "This PIN is already in use")).toBeVisible()//check error on pin input
        await staffObj.closeModal("Add Staff")

        //verify no extra record added
        const latestTotal = await staffObj.getTotalStaff()
        expect(latestTotal).toBe(originalTotal + 1)
        await staffObj.deleteStaff(user.name, "confirm")
    })

    test("TC06[Add] - Add staff with valid data then Cancel (close form)", async () => {
        const user = generateStaff()
        const dataJ = testData.profile2
        const originalTotal = await staffObj.getCurrentTotalStaff()

        await staffObj.addStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier, action: 'cancel' })

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(originalTotal) //no new staff added
        await expect(staffObj.getStaff(user.name)).not.toBeVisible()
    })


    test("TC07[Edit] - Edit staff with valid data ", async ({ }) => {
        const user = generateStaff()
        const dataJ = testData.profile1
        const editData = testData.profile2

        await staffObj.addStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier, action: 'confirm' })
        await expect(staffObj.getStaff(user.name)).toBeVisible({ timeout: 10000 })

        await staffObj.getStaff(user.name).click()//select user from table
        await staffObj.verifySelectedStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier }) //compare data in form added correctly

        //edit
        await staffObj.editStaff(editData) //edit current staff to new (editData : profile 2)
        await expect(staffObj.modal.getByText("Edit Staff")).not.toBeVisible({ timeout: 10000 })

        const newName = editData.name
        await expect(staffObj.getStaff(user.name)).not.toBeVisible()// original staff no longer in the list
        await staffObj.getStaff(newName).click()//select updated staff name from table
        await staffObj.verifySelectedStaff({ name: editData.name, pin: editData.pin, rate: editData.rate, tier: editData.tier }) //compare data in form updated to profile 2 data

        await staffObj.closeModal("Edit Staff")
        await staffObj.deleteStaff(newName, "confirm")
    })

    test("TC08[Edit] - Edit all required field to empty", async ({ }) => {
        const user = generateStaff()
        const dataJ = testData.profile1

        // 1. add user
        await staffObj.addStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier, action: dataJ.action })
        await expect(staffObj.getStaff(user.name)).toBeVisible({ timeout: 10000 })

        await staffObj.getStaff(user.name).click()//select staff from the list   
        //check data in the form correctly according to selected staff
        await staffObj.verifySelectedStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier })

        //Empty staff Name
        await staffObj.editStaff({ name: '' })
        //Empty staff Pin
        await staffObj.editStaff({ pin: '' })
        //Empty staff display order
        await staffObj.editStaff({ staffOrder: '' })

        await staffObj.confirmBtn.click()
        await expect(await staffObj.checkFieldError("Name", "Please type something")).toBeVisible({ timeout: 10000 })
        await expect(await staffObj.checkFieldError("Staff PIN", "PIN must contain exactly 4 digits")).toBeVisible({ timeout: 10000 })
        await expect(await staffObj.checkFieldError("Staff Display Order", "Please enter a positive numbers")).toBeVisible({ timeout: 10000 })

        //clean up
        await staffObj.closeModal("Edit Staff")
        await staffObj.deleteStaff(user.name, "confirm")
        await expect(staffObj.getStaff(user.name)).not.toBeVisible({ timeout: 10000 })


    })

    test("TC09[Edit] - Edit to duplicate existing staff", async ({ page }) => {
        const user1 = generateStaff()
        const user2 = generateStaff()
        const data1 = testData.profile1
        const data2 = testData.profile2

        const staffName1 = user1.name
        const staffName2 = user2.name

        //add 2 staff
        await staffObj.addStaff({ name: staffName1, pin: user1.pin, rate: data1.rate, tier: data1.tier, action: 'confirm' })
        await expect(staffObj.getStaff(staffName1)).toBeVisible({ timeout: 10000 })

        await staffObj.addStaff({ name: staffName2, pin: user2.pin, rate: data2.rate, tier: data2.tier, action: 'confirm' })
        await expect(staffObj.getStaff(staffName2)).toBeVisible({ timeout: 10000 })

        await staffObj.getStaff(staffName2).click()//select staff 2 from the list        

        //check data in the form correctly according to selected staff
        await staffObj.verifySelectedStaff({ name: staffName2, pin: user2.pin, rate: data2.rate, tier: data2.tier })
        const staff2Order = await staffObj.staffOrder.inputValue() //get oerder value of staff 2

        await staffObj.closeModal("Edit Staff")
        await staffObj.getStaff(staffName1).click()//select staff 1 from the list   

        //check data in the form correctly according to selected staff
        await staffObj.verifySelectedStaff({ name: staffName1, pin: user1.pin, rate: data1.rate, tier: data1.tier })

        //update staff 1 details to same as staff 2
        await staffObj.editStaff({ name: staffName2 })
        await staffObj.editStaff({ pin: user2.pin })
        await staffObj.editStaff({ staffOrder: staff2Order })

        //  await staffObj.confirmBtn.click()
        await expect(await staffObj.checkFieldError("Name", "This name is already in use")).toBeVisible({ timeout: 10000 })//error duplicate for name
        await expect(await staffObj.checkFieldError("Staff PIN", "This PIN is already in use")).toBeVisible({ timeout: 10000 }) //error duplicate for PIN
        await expect(page.locator(`.q-field:has(input[aria-label="Staff Display Order"])`)).not.toHaveClass(/q-field--error/, { timeout: 10000 })//display order no issue to duplicate

        await staffObj.closeModal("Edit Staff")

        //clean up
        await staffObj.deleteStaff(staffName2, "confirm")
        await expect(staffObj.getStaff(staffName2)).not.toBeVisible({ timeout: 10000 })
        await staffObj.deleteStaff(staffName1, "confirm")
        await expect(staffObj.getStaff(staffName1)).not.toBeVisible({ timeout: 10000 })

    })

    test("TC10[Edit]- invalid PIN length, invalid staff order", async ({ }) => {
        const user1 = generateStaff()
        const data1 = testData.profile1

        // 1. CREATE 2 user
        await staffObj.addStaff({ name: user1.name, pin: user1.pin, rate: data1.rate, tier: data1.tier, action: 'confirm' }) //user 1
        await expect(staffObj.getStaff(user1.name)).toBeVisible({ timeout: 10000 })

        //  await staffObj.selectStaff(user1.name) 
        await staffObj.getStaff(user1.name).click()//select user 1 from table       
        await staffObj.verifySelectedStaff({ name: user1.name, pin: user1.pin, rate: data1.rate, tier: data1.tier }) //compare data with details in pop up form

        //incorrect staff PIN length
        await staffObj.editStaff({ pin: '111' })
        await staffObj.confirmBtn.click()
        await expect(await staffObj.checkFieldError("Staff PIN", "PIN must contain exactly 4 digits")).toBeVisible() //error duplicate for PIN

        //invalid order value -ve
        await staffObj.editStaff({ staffOrder: '-2' })
        await staffObj.confirmBtn.click()
        await expect(await staffObj.checkFieldError("Staff Display Order", "Please enter a positive numbers")).toBeVisible()
        await staffObj.closeModal("Edit Staff")

        //verify staff 1 information remain unchanged. The restriction/rule working correctly in edit form
        await staffObj.getStaff(user1.name).click()
        await staffObj.verifySelectedStaff({ name: user1.name, pin: user1.pin, rate: data1.rate, tier: data1.tier }) //compare table data with details in pop up form

        //clean up
        await staffObj.closeModal("Edit Staff")
        await staffObj.deleteStaff(user1.name, "confirm")
        await expect(staffObj.getStaff(user1.name)).not.toBeVisible({ timeout: 10000 })
    })

    test("TC11[Edit]- Edit staff with valid data then Cancel (close form) ", async ({ }) => {
        const user = generateStaff()
        const dataJ = testData.profile1


        await staffObj.addStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier, action: 'confirm' })
        await expect(staffObj.getStaff(user.name)).toBeVisible({ timeout: 10000 })

        const originalTotal = await staffObj.getCurrentTotalStaff()
        await staffObj.getStaff(user.name).click()//select staff from table
        await staffObj.verifySelectedStaff({ name: user.name, pin: user.pin, rate: dataJ.rate, tier: dataJ.tier }) //compare table data with details in pop up form

        //cancel edit
        await staffObj.editStaff({ name: "staff-Edit-Cancel", pin: "0000", action: 'cancel' })

        //no new staff added
        await expect(staffObj.getStaff("staff-Edit-Cancel")).not.toBeVisible()
        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(originalTotal) //no new staff added

        //clean up
        await staffObj.deleteStaff(user.name, "confirm")
        await expect(staffObj.getStaff(user.name)).not.toBeVisible()
    })


    // //delete staff
    //OK
    test("TC12[Delete] - Delete staff - OK", async ({ }) => {
        const user1 = generateStaff()
        const dataJ = testData.profile1
        const currentTotal = await staffObj.getCurrentTotalStaff()

        const nameUser1 = user1.name

        //add new staff
        await staffObj.addStaff({ name: user1.name, pin: user1.pin, rate: dataJ.rate, tier: dataJ.tier, action: 'confirm' })
        await expect(staffObj.getStaff(nameUser1)).toBeVisible({ timeout: 10000 })

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(currentTotal + 1) //staff number increase

        await staffObj.deleteStaff(nameUser1, "confirm")
        await expect(staffObj.getStaff(nameUser1)).not.toBeVisible({ timeout: 10000 })

        //count staff
        const latestTotalFinal = await staffObj.getCurrentTotalStaff()
        expect(latestTotalFinal).toBe(currentTotal) //staff back to original number

    })
    test("TC13[Delete]- Delete staff > Cancel button", async ({ }) => {
        const user1 = generateStaff()
        const dataJ = testData.profile1
        const originalTotal = await staffObj.getCurrentTotalStaff()

        const nameUser1 = user1.name

        //add new staff
        await staffObj.addStaff({ name: user1.name, pin: user1.pin, rate: dataJ.rate, tier: dataJ.tier, action: 'confirm' } as any)
        await expect(staffObj.getStaff(nameUser1)).toBeVisible({ timeout: 10000 })

        const latestTotal = await staffObj.getCurrentTotalStaff()
        expect(latestTotal).toBe(originalTotal + 1) //staff number increase

        await staffObj.deleteStaff(nameUser1, 'cancel')

        //count staff
        const latestTotalFinal = await staffObj.getCurrentTotalStaff()
        expect(latestTotalFinal).toBe(originalTotal + 1)

        //clean up
        await staffObj.deleteStaff(nameUser1, "confirm")
    })
})