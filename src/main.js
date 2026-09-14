import { EventBus }       from './events/EventBus.js';
import { TaskView }       from './views/TaskView.js';
import { StorageService } from './services/StorageService.js';
import { TaskManager }    from './services/TaskManager.js';
import { TaskController } from './controllers/TaskController.js';

const eventBus   = new EventBus();
const storage    = new StorageService();
const manager    = new TaskManager(storage, eventBus);
const view       = new TaskView();
const controller = new TaskController(view, manager, eventBus);

controller.init();