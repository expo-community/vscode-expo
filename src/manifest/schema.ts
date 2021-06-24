import jsonSchemaTraverse from 'json-schema-traverse';
import * as xdl from 'xdl/build/project/ExpSchema';

type JsonSchema = {
  [key: string]: any;
};

export type ManifestSchema = {
  $schema: string;
  type: 'object';
  version: string;
  additionalProperties: true;
  required: string[];
  definitions?: any;
  properties: {
    expo: any;
  };
};

/**
 * Create a vscode compatible JSON schema by fetching the versioned XDL schema.
 */
export async function create(sdkVersion: string) {
  const xdlSchema = await xdl.getSchemaAsync(sdkVersion);
  return createFromXdl(sdkVersion, xdlSchema);
}

/**
 * Create a vscode compatible JSON schema object from XDL schema.
 * This will try to make some adjustments to the downloaded schema:
 *   1. wrap the properties into an `expo` property for managed validation
 *   2. append `schema.meta.bareWorkflow` notes to the `schema.description`
 *   2. copy `schema.description` properties into `schema.markdownDescription` to render as markdown
 *
 * @remark When something fails in 2..3, it falls back to the original schema and only apply 1.
 * @see https://github.com/microsoft/vscode/blob/1dff50d211472de4667db626ef2d6d32265eb0e6/src/vs/workbench/services/configuration/common/configurationExtensionPoint.ts#L64
 */
export function createFromXdl(sdkVersion: string, xdlSchema: JsonSchema): ManifestSchema {
  // note: we need to create a copy, if something fails we need the original object
  let enhancedSchema = JSON.parse(JSON.stringify(xdlSchema));

  try {
    jsonSchemaTraverse(enhancedSchema, (nestedSchema: JsonSchema) => {
      mutateSchemaBareWorkflowDescription(nestedSchema);
      mutateSchemaMarkdownDescription(nestedSchema);
    });
  } catch (error) {
    // todo: add telemetry, fallback to original schema
    enhancedSchema = xdlSchema;
  }

  // note: we need to move over definitions from the schema and put them into root
  const { definitions } = enhancedSchema;
  if (definitions) {
    delete enhancedSchema.definitions;
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    version: sdkVersion,
    additionalProperties: true,
    required: ['expo'],
    definitions,
    properties: {
      expo: enhancedSchema,
    },
  };
}

/**
 * Appends the `meta.bareWorkflow` to the `descrption` with a `**Bare Workflow**` prefix.
 * If there is no `meta.bareWorkflow` value, it's skipped.
 */
export function mutateSchemaBareWorkflowDescription(schema: JsonSchema) {
  if (schema.meta?.bareWorkflow) {
    const description = schema.description || '';
    const bareNotes = schema.meta.bareWorkflow;
    schema.description = `${description}\n\n**Bare workflow** - ${bareNotes}`.trim();
  }
}

/**
 * Copies the `description` property to `markdownDescription` for vscode markdown rendering.
 * If there is no `description` value, it skips the `markdownDescription`.
 */
export function mutateSchemaMarkdownDescription(schema: JsonSchema) {
  if (schema.description && !schema.markdownDescription) {
    schema.markdownDescription = schema.description;
  }
}
