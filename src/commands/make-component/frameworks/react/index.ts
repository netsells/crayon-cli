import config from '../../../../config';
import { ejectTemplates, generateTemplates } from '../../templates';
import type { FrameworkModule } from '../../types';
import { generateTemplateData } from '../../utils';
import componentTemplate from './templates/Component.tsx';
import storiesTemplate from './templates/Component.stories.ts';
import testsTemplate from './templates/Component.spec.ts';

export const run: FrameworkModule['run'] = async ({
    componentName,
    path,
    props,
}) => {
    const crayonConfig = await config();

    const templateData = generateTemplateData({
        componentName,
        props,
        testRunner: crayonConfig?.features?.tests
            ? crayonConfig?.features?.tests?.runner
            : undefined,
    });

    const templates = generateTemplates({
        componentName,
        outputPath: path,
        templateData,
        componentTemplate,
        storiesTemplate,
        testsTemplate,
    });

    await templates.component();

    if (crayonConfig?.features?.storybook) {
        await templates.stories();
    }

    if (crayonConfig?.features?.tests) {
        await templates.tests();
    }
};

export const eject: FrameworkModule['eject'] = async () => {
    const crayonConfig = await config();
    const templates = await ejectTemplates({
        componentFileName: 'Component.vue',
    });

    await templates.component();

    if (crayonConfig?.features?.storybook) {
        await templates.stories();
    }

    if (crayonConfig?.features?.tests) {
        await templates.tests();
    }

    return templates.templatesPath;
};
