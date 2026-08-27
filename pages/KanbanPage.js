class KanbanPage {
    constructor(page) {
        this.page = page;

        this.addTaskButton = page.locator("button.hidden");
        this.titleInput = page.locator("#Title");
        this.descriptionInput = page.locator("#Description");
        this.subtaskInputs = page.locator("input.peer");
        this.statusDropdown = page.locator("div.text-sm");
        this.dropdownOptions = page.locator("div.hidden.absolute div");
        this.columnMoveOptions = page.locator("div div.hidden.absolute.rounded div");
        this.submitButton = page.locator('button[type="submit"]');
        this.columns = page.locator("section");
        this.subtaskLabels = page.locator("div label span");
    }

    async goto() {
        await this.page.goto("https://kanban-566d8.firebaseapp.com/");
    }

    cardsInColumn(columnIndex) {
        return this.columns.nth(columnIndex).locator("article");
    }

    findCardByTitleInColumn(columnIndex, title) {
        return this.cardsInColumn(columnIndex).filter({ hasText: title });
    }

    async createTask({ title = "Random task" } = {}) {
        await this.addTaskButton.click();
        await this.titleInput.fill(title);
        await this.descriptionInput.fill("Random task description");
        await this.subtaskInputs.nth(1).fill("First subtask");
        await this.subtaskInputs.nth(2).fill("Second subtask");
        await this.statusDropdown.nth(1).click();
        await this.dropdownOptions.nth(2).click();
        await this.submitButton.click();
        return title;
    }

    async getCardProgress(card) {
        const text = await card.locator("p").textContent();
        const match = text.match(/(\d+)\s+of\s+(\d+)\s+substasks/);
        if (!match) throw new Error(`No se pudo leer el progreso desde: "${text}"`);
        return { completed: Number(match[1]), total: Number(match[2]) };
    }

    async getCardTitle(card) {
        return (await card.locator("h3").textContent()).trim();
    }

    async findIncompleteCard(columnIndex) {
        const cards = await this.cardsInColumn(columnIndex).all();

        for (const card of cards) {
            const { completed, total } = await this.getCardProgress(card);
            if (completed !== total) {
                return { card, title: await this.getCardTitle(card), completed, total };
            }
        }
        return null;
    }

    async getOrCreateIncompleteCard(columnIndex) {
        const existing = await this.findIncompleteCard(columnIndex);
        if (existing) return existing;

        const title = await this.createTask();
        const cards = await this.cardsInColumn(columnIndex).all();
        const newCard = cards[cards.length - 1];
        return { card: newCard, title, completed: 0, total: 2 };
    }

    async openCard(card) {
        await card.click();
    }

    async completeFirstPendingSubtask() {
        const labels = await this.subtaskLabels.all();

        for (const label of labels) {
            const isDone = await label.evaluate(
                el => getComputedStyle(el).textDecorationLine.includes("line-through")
            );
            if (!isDone) {
                await label.click();
                return label;
            }
        }
        throw new Error("No se encontró ningún subtask pendiente por completar");
    }

    async moveCardToFirstColumn() {
        await this.statusDropdown.nth(2).click();
        await this.columnMoveOptions.nth(0).click();
    }

    async closeCardEditor() {
        await this.page.keyboard.press("Escape");
    }
}

module.exports = { KanbanPage };