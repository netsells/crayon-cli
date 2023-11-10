import kebabCase from 'lodash.kebabcase';
import camelCase from 'lodash.camelcase';
import template from 'lodash.template';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import BaseCommand from '../BaseCommand.js';
import { propTypes, tsTypes } from './prop-types.js';
import config from '../../config.js';
import { globSync } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MakeComponent extends BaseCommand {
    /**
     * @inheritDoc
     */
    get commandName() {
        return 'make:component';
    }

    /**
     * Return the stub files.
     *
     * @returns {string[]}
     */
    get stubs() {
        return [
            'Component.vue.stub',
            'Component.spec.js.stub',
            'Component.stories.js.stub',
        ];
    }

    /**
     * @inheritDoc
     */
    async handle() {
        try {
            if (this.options.eject) {
                return this.eject();
            }

            if (!this.args.component) {
                return this.error('Component path is required');
            }

            this.path = this.args.component;
            this.props = [];

            this.componentName = this.path.split('/').slice(-1)[0];
            this.framework = this.options.framework || config.framework;

            if (!config.framework) {
                await this.askFramework();
            }

            if (existsSync(resolve(this.path, `${ this.componentName }.vue`))) {
                this.error(`${ this.componentName } already exists at [${ this.path }].`);

                return;
            }

            if (!this.options.skipProps) {
                await this.askProps();
            }

            await this.confirmConfig();
            this.generateTemplates();

            this.success(`${ this.componentName } scaffolding created successfully at [${ this.path }].`);
        } catch (e) {
            console.log(e);
            this.error(e);
        }
    }

    /**
     * Return the default stubs directory.
     *
     * @returns {string}
     */
    get defaultStubDirectory() {
        return resolve(__dirname, 'stubs');
    }

    /**
     * Return the stub directory.
     *
     * @returns {string}
     */
    get stubDirectory() {
        if (this.isEjected) {
            return resolve(
                this.ejectPath,
                'stubs',
            );
        }

        return resolve(__dirname, 'stubs');
    }

    /**
     * Eject the stub templates.
     */
    eject() {
        this.ensureDirectoryExists(`${ this.ejectPath }/stubs`);

        this.stubs.forEach((stub) => {
            const stubContent = this.loadStub(stub, {
                directory: this.defaultStubDirectory,
            });

            writeFileSync(
                `${ this.ejectPath }/stubs/${ stub }`,
                stubContent,
                'utf-8',
            );
        });
    }

    /**
     * Generate the component templates from their stubs.
     */
    generateTemplates() {
        const outputDirectory = resolve(
            process.cwd(),
            this.path,
        );

        this.ensureDirectoryExists(outputDirectory);

        const replacements = {
            pascalName: this.componentName,
            camelName: camelCase(this.componentName),
            kebabName: kebabCase(this.componentName),
            toRoot: '../'.repeat(this.path.split('/').length),
            props: this.props,
        };

        this.stubs.forEach((stub) => {
            const stubTemplate = this.loadStubTemplate(stub)(replacements)
                .replace(/\n\s*\n/g, '\n\n');

            const filename = stub
                .replace('Component', this.componentName)
                .replace('.stub', '');

            writeFileSync(`${ outputDirectory }/${ filename }`, stubTemplate);
        });
    }

    /**
     * Ask for the prop name, with validation.
     *
     * @returns {Promise<string>}
     */
    async askPropName() {
        let name;

        while (!name) {
            name = await this.ask('Name');

            if (!name) {
                this.error('Please provide a name');
            } else if (name !== camelCase(name)) {
                this.error('Name must be camelcase');
                name = undefined;
            } else if (this.props.find((prop) => prop.name === name)) {
                this.error('Prop already defined');
                name = undefined;
            }
        }

        return name;
    }

    /**
     * Ask for the prop types, with validation.
     *
     * @returns {Promise<Array>}
     */
    async askPropTypes() {
        let types = [];

        while (!types.length) {
            types = await this.multiple(
                'Select type(s)',
                Object.keys(propTypes).map((name) => ({
                    name,
                    value: name,
                })),
            );

            if (!types.length) {
                this.error('Please select one or more types');
            }
        }

        return types;
    }

    /**
     * Ask the user to input props.
     *
     * @returns {Promise<void>}
     */
    async askProps() {
        let defineProps = await this.confirm('Would you like to define props?');

        while (defineProps) {
            const name = await this.askPropName();
            const types = await this.askPropTypes();

            const { component, arg } = propTypes[types[0]];

            this.props.push({
                name,
                types,
                propValue: component,
                argValue: arg,
                tsTypes: Object.entries(tsTypes)
                    .filter(([key]) => types.find((type) => type === key))
                    .map(([, type]) => type),
            });

            defineProps = await this.confirm('Would you like to define another?');
        }
    }


    /**
     * Ask the user to input props.
     *
     * @returns {Promise<void>}
     */
    async askFramework() {
        const frameworks = globSync(`${ __dirname }/stubs/frameworks/*`).map((directory) => directory.replace(`${ __dirname }/stubs/frameworks/`, ''));

        this.framework = await this.select(
            'Select framework:',
            frameworks.map((name) => ({
                name,
                value: name,
            })),
        );
    }

    /**
     * Load a stub.
     *
     * @param {string} path
     * @param {object} options
     * @param {string} options.directory
     *
     * @returns {string}
     */
    loadStub(path, {
        directory = this.stubDirectory,
    } = {}) {
        return readFileSync(
            resolve(
                directory,
                'frameworks',
                this.framework,
                path,
            ),
            'utf8',
        );
    }

    /**
     * Load a template stub.
     *
     * @param {string} path
     *
     * @returns {Function}
     */
    loadStubTemplate(path) {
        return template(this.loadStub(path));
    }

    /**
     * Prompt the user to confirm the current config.
     *
     * @returns {Promise<void>}
     */
    async confirmConfig() {
        this.info(`Scaffolding component at: ${ this.path }`);

        if (this.props.length) {
            this.info('Props:');

            this.props.forEach(({ name, types }) => {
                this.info(`${ name }: [${ types.join(', ') }]`);
            });
        }

        if (!(await this.confirm('Is this correct?'))) {
            process.exit(0);
        }
    }
}

export default MakeComponent;