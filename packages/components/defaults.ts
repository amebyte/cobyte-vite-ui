import { App } from 'vue';
import components from './components';

const install = function (app: App) {
    components.forEach(component => {
        app.component(component.name, component);
    });
};

export default {
    install
};