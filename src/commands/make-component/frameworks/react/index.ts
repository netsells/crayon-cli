import { camelCase, kebabCase, pascalCase } from 'scule';
import { type Prop } from '../../props';
import { log } from '@clack/prompts';
import config from '../../../../config';
import { ejectStub, generateStub } from '../../stubs';

interface TemplateData {
    component: {
        name: {
            pascal: ReturnType<typeof pascalCase>;
            kebab: ReturnType<typeof pascalCase>;
            camel: ReturnType<typeof pascalCase>;
        };
        props: Prop[];
    };
}

const generateComponentStub = ({
    componentName,
    path,
    templateData,
}: {
    componentName: string;
    path: string;
    templateData: TemplateData;
}) => {
    generateStub({
        fileName: `${componentName}.tsx`,
        path,
        templateData,
        stubFile: 'Component.tsx.stub',
    });
};

const generateStoriesStub = ({
    componentName,
    path,
    templateData,
}: {
    componentName: string;
    path: string;
    templateData: TemplateData;
}) => {
    generateStub({
        fileName: `${componentName}.stories.tsx`,
        path,
        templateData,
        stubFile: 'Component.stories.tsx.stub',
    });
};

const generateTemplateData = ({
    componentName,
    props,
}: {
    componentName: string;
    props: Prop[];
}): TemplateData => ({
    component: {
        name: {
            pascal: pascalCase(componentName),
            kebab: kebabCase(componentName),
            camel: camelCase(componentName),
        },

        props,
    },
});

export const run = async ({
    componentName,
    path,
    props,
}: {
    componentName: string;
    path: string;
    props: Prop[];
}) => {
    const crayonConfig = await config();

    const templateData = generateTemplateData({
        componentName,
        props,
    });

    generateComponentStub({
        componentName,
        path,
        templateData,
    });

    if (crayonConfig?.features?.storybook) {
        generateStoriesStub({
            componentName,
            path,
            templateData,
        });
    }
};

export const eject = async () => {
    const crayonConfig = await config();

    ejectStub('Component.tsx.stub');
    log.success('Ejected Component.tsx.stub');

    if (crayonConfig?.features?.storybook) {
        ejectStub('Component.stories.tsx.stub');
        log.success('Ejected Component.stories.tsx.stub');
    }
};
