import { Page, Locator, expect } from "@playwright/test";


export class manageStaff {
  readonly page: Page
  readonly modal: Locator
  readonly btnAddStaff: Locator
  readonly staffName: Locator
  readonly staffPin: Locator
  readonly staffRate: Locator
  readonly staffOrder: Locator
  readonly closeBtn: Locator
  readonly confirmBtn: Locator
  readonly staffTierDropdown: Locator
  readonly deleteBtn: Locator

  readonly staffTier: {
    Assistant: Locator
    Junior: Locator
    Senior: Locator
  }

  readonly staffTableRow: Locator

  constructor(page: Page) {
    this.page = page
    this.modal = page.getByRole('dialog');
    this.btnAddStaff = page.getByRole('button', { name: 'Add staff' })
    this.staffName = this.modal.getByLabel('Name')
    this.staffPin = this.modal.getByLabel('Staff PIN')
    this.staffRate = this.modal.getByLabel('Hourly Rate (RM)')
    this.staffOrder = this.modal.getByLabel('Staff Display Order')
    this.closeBtn = this.modal.locator('button:has(i[role="img"]:text("close"))')
    this.confirmBtn = this.modal.getByRole('button', { name: 'Confirm' })
    this.deleteBtn = this.modal.getByRole('button', { name: 'Delete' })
    this.staffTierDropdown = page.getByRole('combobox', { name: 'Staff Commission Tier' });
    this.staffTableRow = this.page.locator('tbody tr.q-tr')

    this.staffTier = {
      Assistant: this.page.getByRole('option', { name: /^Assistant$/ }),
      Junior: this.page.getByRole('option', { name: /^Junior$/ }),
      Senior: this.page.getByRole('option', { name: /^Senior$/ }),

    }
  }
  async clearEnvironment() {
    while ((await this.getCurrentTotalStaff()) > 0) {
      await this.page.locator('tbody tr.q-tr').first().click()
      await expect(this.modal).toContainText('Edit Staff')
      await this.deleteBtn.click()
      const deleteDialog = this.page.locator('.q-dialog', { has: this.page.getByText('Confirm Delete', { exact: true }) })
      await expect(deleteDialog).toBeVisible({ timeout: 10000 })
      await deleteDialog.getByRole('button', { name: 'CONFIRM' }).click()
      await this.page.waitForTimeout(1000)
    }

  }
  async loginPage(name: string, pwd: string) {
    await this.page.goto("https://hq.staging.qashier.com/employee-management")
    await this.page.getByPlaceholder("Enter your email address", { exact: true }).fill(name)
    await this.page.getByPlaceholder("Enter your password", { exact: true }).fill(pwd)
    await this.page.getByRole('button', { name: 'Sign In' }).click()
    // await expect(this.page.getByRole('toolbar')).toBeVisible({ timeout: 15000 })
  }
  async closeModal(msg: string) { //function to close dialog pop up
    await this.closeBtn.click({ force: true })
    await expect(this.modal.getByRole('dialog').getByText(msg)).not.toBeVisible({ timeout: 10000 })
  }

  async checkFieldError(label: string, message: string) { //function to check error message based on which field (name,pin,order)
    await this.page.waitForTimeout(1000)
    const root = this.page.locator(`.q-field:has(input[aria-label="${label}"])`)

    await expect(root).toHaveClass(/q-field--error/, { timeout: 10000 })
    return root.locator('[role="alert"]').filter({ hasText: message })
  }

  async getTotalStaff() {
    const text = await this.page.locator('.q-table__bottom-item').last().innerText()
    return Number(text.split('of')[1]?.trim() ?? 0)
  }

  async getCurrentTotalStaff() {
    const noDataCount = await this.page.getByText('No data available').count()

    if (noDataCount > 0) {
      return 0
    }

    return await this.getTotalStaff()
  }

  async selectTier(tier: string) { //function to select dropdown tier
    await this.staffTierDropdown.click()
    await this.page.getByRole('option', { name: tier }).click()
  }

  async addStaff({ name, pin, action, rate, tier }: { name?: string, pin?: string, action?: string, rate?: string, tier?: string }) { // add staff function
    await this.btnAddStaff.click()
    await expect(this.page.getByRole('dialog')).toContainText('Add Staff')


    if (name) {
      await this.staffName.fill(name)
    }

    if (pin) {
      await this.staffPin.fill(pin)
    }

    //optional 
    if (rate) {
      await this.staffRate.fill(rate)
    }

    if (tier) {
      await this.selectTier(tier)
    }

    if (action === 'confirm') {
      await this.confirmBtn.first().click()
    }

    if (action === 'cancel') {
      this.closeModal("Add Staff")
    }
    await this.page.waitForTimeout(1000)

  }

  async checkStaffDetailsInTable(staff: { name: string, pin?: string, rate?: string, tier?: string }) { //function to check data with list in staff table

    const row = this.page.locator('tbody tr.q-tr', { hasText: staff.name })
    await expect(row).toBeVisible()

    if (staff.tier) {
      await expect(row.locator('td').nth(1)).toHaveText(staff.tier)
    }

    //didnt check for pin and rate because didnt visible in staff table list
    //  await expect(row.locator('td').nth(2)).toHaveText(staff.pin!)
    //  await expect(row.locator('td').nth(1)).toHaveText(staff.rate ? `RM${staff.rate}` : "RM0.00")

  }

  public getStaff(name: string) { //return selector of staff name
    const row = this.page.locator('tbody tr.q-tr', { hasText: name })
    return row
  }

  async verifySelectedStaff(staff: { name: string, pin: string, rate?: string, tier?: string }) { //verify selected staff data correctly same as in form
    await expect(this.modal).toBeVisible()
    await expect(this.modal).toContainText('Edit Staff')
    await expect(this.staffName).toHaveValue(staff.name)
    await expect(this.staffPin).toHaveValue(staff.pin)

    // tier
    if (staff.tier) {
      await expect(this.staffTierDropdown).toHaveValue(staff.tier)
    }

    // rate
    const raw = staff.rate!.replace('RM', '').replace('.00', '').trim()
    await expect(this.staffRate).toHaveValue(raw ?? "0");
  }

  async editStaff({ name, pin, staffOrder, rate, action, tier }: { name?: string, pin?: string, staffOrder?: string, rate?: string, action?: string, tier?: string }) { //edit staff function

    if (name !== undefined) {
      await this.staffName.fill(name)
    }

    if (pin !== undefined) {
      await this.staffPin.fill(pin)
    }
    if (staffOrder !== undefined) {
      await this.staffOrder.fill(staffOrder)
    }

    if (rate !== undefined) {
      await this.staffRate.fill(rate)
    }

    if (tier !== undefined) {
      await this.selectTier(tier)
    }

    if (action === 'confirm') {
      await this.confirmBtn.first().click()
    }

    if (action === 'cancel') {
      this.closeModal("Edit Staff")
    }
  }

  async deleteStaff(name: string, action: string) {

    await this.getStaff(name).click()

    await expect(this.modal).toContainText('Edit Staff')
    await this.deleteBtn.click()
    const deleteDialog = this.page.locator('.q-dialog', { has: this.page.getByText('Confirm Delete', { exact: true }) })
    await expect(deleteDialog).toBeVisible({ timeout: 10000 })

    if (action === "confirm") {
      await deleteDialog.getByRole('button', { name: 'CONFIRM' }).first().click()
      await expect(this.staffTableRow.filter({ has: this.page.getByText(name, { exact: true }) })).toHaveCount(0)
      await expect(this.modal.getByText("Edit Staff")).not.toBeVisible({ timeout: 10000 })
    }

    if (action === "cancel") {
      await deleteDialog.getByRole('button', { name: 'CANCEL' }).click()
      await expect(this.modal.getByText("Edit Staff")).toBeVisible({ timeout: 10000 })
      await this.closeModal("Edit Staff")
      await expect(this.staffTableRow.filter({ has: this.page.getByText(name, { exact: true }) })).toHaveCount(1)
    }


  }
}