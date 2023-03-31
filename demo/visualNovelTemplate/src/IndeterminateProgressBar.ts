/**
 * An indterminate progress bar that displays progress of an unknown
 * amount of tasks.
 * 
 * Designed to work best with tree-structured dependencies (dependencies that
 * load more dependencies).
 * 
 * Guarantees
 *   - never reach 100% / maxProgress (until you declare it's done)
 *   - always increase when there is progress
 *   - never increase when there is no progress
 *   - never decrease
 */
class IndeterminateProgressBar {
    public numPending = 0;
    public numDone = 0;
    /**
     * how much progress '0% done' is
     */
    public minProgress = 0.1;
    /**
     * how much progress '100% done' is
     */
    public maxProgress = 0.95;

    /**
     * More negative bias -> fill slower at the start. Assume there is more work coming up.
     * 
     * More positive bias -> fill faster at the start. Assume there is less work coming up.
     */
    public bias = -0.5;

    private taskTree: Task[] = [];
    private recentlyCompletedTasks: Task[] = [];
    private recentlyAddedTasks: Task[] = [];

    public addTask(): Task {
        const task = new Task();
        this.recentlyAddedTasks.push(task);
        return task;
    }

    public completeTask(task: Task) {
        // store completed tasks
        // assume recently added tasks are a result of recently completed tasks
        // (task could be marked complete before or after adding new tasks)
        // (implementation takes a guess at which)
        this.recentlyCompletedTasks.push(task);
    }

    public addPromise(promise: Promise<any>) {
        const task = this.addTask();
        promise.then(() => this.completeTask(task));
    }

    /**
     * Update the progress. Should be called periodically (ex. every frame).
     */
    public tick() {
        //
    }

    public getProgress() {
        // return progressEstimate ** (-bias)
    }
}

class Task {
    public progress = 0;
}
