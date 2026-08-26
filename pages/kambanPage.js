class KanbanPage {
    constructor(page) {
        this.page = page;

        // Selectores centralizados — si la UI cambia, aquí es el ÚNICO lugar que se toca
        this.addTaskButton = page.locator("button.hidden");
        this.titleInput = page.locator("#Title");
        this.descriptionInput = page.locator("#Description");
        this.subtaskInputs = page.locator("input.peer");
        this.statusDropdown = page.locator("div.text-sm");
        this.dropdownOptions = page.locator("div.hidden.absolute div");
        this.columnMoveOptions = page.locator("div div.hidden.absolute.rounded div");
        this.submitButton = page.locator('button[type="submit"]');
        this.columns = page.locator("section");
    }

    async goto() {
        await this.page.goto("https://kanban-566d8.firebaseapp.com/");
    }

    column(index) {
        return this.columns.nth(index);
    }

    cardsInColumn(index) {
        return this.column(index).locator("article");
    }

    // --- Creación de tareas ---
    async createTask({ title = "Random task", subtasks = ["First subtask", "Second subtask"] } = {}) {
        await this.addTaskButton.click();
        await this.titleInput.fill(title);
        await this.descriptionInput.fill("Random task description");

        for (let i = 0; i < subtasks.length; i++) {
            await this.subtaskInputs.nth(i + 1).fill(subtasks[i]);
        }

        await this.statusDropdown.nth(1).click();
        await this.dropdownOptions.nth(2).click();
        await this.submitButton.click();

        return title; // el llamador decide qué hacer con esto
    }

    // --- Lectura de datos de una carta ---
    async getCardProgress(card) {
        const text = await card.locator("p").textContent();
        const match = text.match(/(\d+)\s+of\s+(\d+)\s+substasks/);
        if (!match) throw new Error(`No se pudo leer el progreso desde: "${text}"`);
        return { completed: Number(match[1]), total: Number(match[2]) };
    }

    async getCardTitle(card) {
        return (await card.locator("h3").textContent()).trim();
    }

    // --- Búsqueda de una carta candidata ---
    async findIncompleteCard(columnIndex) {
        const cards = this.cardsInColumn(columnIndex);
        const count = await cards.count();

        for (let i = 0; i < count; i++) {
            const card = cards.nth(i);
            const { completed, total } = await this.getCardProgress(card);
            if (completed !== total) {
                return { index: i, title: await this.getCardTitle(card), completed, total };
            }
        }
        return null; // ninguna candidata: el llamador decide qué hacer
    }

    // --- Acciones dentro del editor de carta ---
    async openCard(columnIndex, cardIndex) {
        await this.cardsInColumn(columnIndex).nth(cardIndex).click();
    }

    async completeFirstPendingSubtask() {
        const subtasks = this.page.locator("div label span");
        const count = await subtasks.count();

        for (let j = 0; j < count; j++) {
            const isDone = await subtasks.nth(j).evaluate(
                el => getComputedStyle(el).textDecorationLine.includes("line-through")
            );
            if (!isDone) {
                await subtasks.nth(j).click();
                return subtasks.nth(j); // regresa el locator por si el test quiere verificarlo
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