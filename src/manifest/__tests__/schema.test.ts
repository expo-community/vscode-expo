import traverse, { Callback } from 'json-schema-traverse';
import * as xdl from 'xdl/build/project/ExpSchema';

import * as tools from '../../../test/tools';
import * as schema from '../schema';

// note: this is the same value as `traverse`, but typed as mock
const mockedTraverse = (traverse as unknown) as jest.Mock<[object, Callback]>;

describe('create', () => {
  it('fetches schema by expo sdk version', async () => {
    const xdlSchema = tools.getFixtureFile('schema-xdl-39.0.0.json');
    const spy = jest.spyOn(xdl, 'getSchemaAsync').mockResolvedValue(xdlSchema);

    expect(await schema.create('39.0.0')).toBeDefined();
    expect(spy).toBeCalledWith('39.0.0');
  });
});

describe('createFromXdl', () => {
  describe('sdk 39', () => {
    const xdlSchema = tools.getFixtureFile('schema-xdl-39.0.0.json');
    const simpleSchema = tools.getFixtureFile('schema-plugin-39.0.0.json');
    const enhancedSchema = tools.getFixtureFile('schema-enhanced-39.0.0.json');

    it('creates enhanced plugin schema from xdl', () => {
      const createdSchema = schema.createFromXdl('39.0.0', xdlSchema);
      expect(createdSchema).toStrictEqual(expect.objectContaining(enhancedSchema));
    });

    it('uses simple plugin schema when failing to enhance', () => {
      mockedTraverse.mockImplementationOnce(() => {
        throw new Error('Failed traversing schema');
      });
      const createdSchema = schema.createFromXdl('39.0.0', xdlSchema);
      expect(createdSchema).toStrictEqual(expect.objectContaining(simpleSchema));
    });
  });

  describe('sdk 41', () => {
    const xdlSchema = tools.getFixtureFile('schema-xdl-41.0.0.json');
    const simpleSchema = tools.getFixtureFile('schema-plugin-41.0.0.json');
    const enhancedSchema = tools.getFixtureFile('schema-enhanced-41.0.0.json');

    it('creates enhanced plugin schema from xdl', async () => {
      const createdSchema = schema.createFromXdl('41.0.0', xdlSchema);
      expect(createdSchema).toStrictEqual(expect.objectContaining(enhancedSchema));
    });

    it('uses simple plugin schema when failing to enhance', () => {
      mockedTraverse.mockImplementationOnce(() => {
        throw new Error('Failed traversing schema');
      });
      const createdSchema = schema.createFromXdl('41.0.0', xdlSchema);
      expect(createdSchema).toStrictEqual(expect.objectContaining(simpleSchema));
    });
  });
});

describe('mutateSchemaBareWorkflowDescription', () => {
  const description = 'Info about a property';
  const bareWorkflow = 'Check this other property out instead';

  it('skips without `schema.meta.bareWorkflow`', () => {
    const property = { description };
    schema.mutateSchemaBareWorkflowDescription(property);
    expect(property.description).toBe(description);
  });

  it('appends `schema.meta.bareWorkflow` to missing `schema.description`', () => {
    const property = { meta: { bareWorkflow } };
    schema.mutateSchemaBareWorkflowDescription(property);
    expect(property).toHaveProperty('description', `**Bare workflow** - ${bareWorkflow}`);
  });

  it('appends `schema.meta.bareWorkflow` to existing `schema.description`', () => {
    const property = { description, meta: { bareWorkflow } };
    schema.mutateSchemaBareWorkflowDescription(property);
    expect(property.description).toBe(`${description}\n\n**Bare workflow** - ${bareWorkflow}`);
  });
});

describe('mutateSchemaMarkdownDescription', () => {
  const description = 'Info about a property';

  it('skips without `schema.description`', () => {
    const property = {};
    schema.mutateSchemaMarkdownDescription(property);
    expect(property).not.toHaveProperty('markdownDescription');
  });

  it('copies `schema.description` to `schema.markdownDescription`', () => {
    const property = { description };
    schema.mutateSchemaMarkdownDescription(property);
    expect(property).toHaveProperty('markdownDescription', description);
  });

  it('skips copy `schema.description` to `schema.markdownDescription` if it exists already', () => {
    const property = { description, markdownDescription: 'Something else' };
    schema.mutateSchemaMarkdownDescription(property);
    expect(property).toHaveProperty('markdownDescription', 'Something else');
  });
});
