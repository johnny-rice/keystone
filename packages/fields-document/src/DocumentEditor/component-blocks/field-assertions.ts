import { type ComponentSchema } from './api-shared'
import { assertNever } from './utils'

export function assertValidComponentSchema(
  schema: ComponentSchema,
  lists: ReadonlySet<string>,
  mode: 'structure' | 'document'
) {
  assertValidComponentSchemaInner(schema, [], [], new Set(), lists, mode)
}

// recursive things can exist but they have to either be:
// - inside the non-default portion of a conditional field
// - inside an array field
// when we hit the non-default portion of a conditional field or an array field
// checking inside of it essentially means pretend it's a new thing
function assertValidComponentSchemaInner(
  schema: ComponentSchema,
  schemaAncestors: ComponentSchema[],
  propPath: string[],
  seenProps: Set<ComponentSchema>,
  lists: ReadonlySet<string>,
  mode: 'structure' | 'document'
) {
  if (schema.kind === 'form') {
    if (mode === 'structure' && !schema.graphql) {
      throw new Error(
        `There is a form field without a configured GraphQL schema at "${propPath.join('.')}", fields used in the structure field must have a GraphQL schema.`
      )
    }
    return
  }
  if (schema.kind === 'child') {
    if (mode === 'structure') {
      throw new Error(
        `There is a child field at "${propPath.join('.')}" but child fields are not allowed in structure fields.`
      )
    }
    return
  }
  if (schema.kind === 'relationship') {
    if (lists.has(schema.listKey)) {
      return
    }
    throw new Error(
      `The relationship field at "${propPath.join('.')}" has the listKey "${
        schema.listKey
      }" but no list named "${schema.listKey}" exists.`
    )
  }
  const ancestor = schemaAncestors.indexOf(schema)
  if (ancestor !== -1) {
    throw new Error(
      `The field "${propPath.join(
        '.'
      )}" is the same as it's ancestor. Use an array or conditional field for recursive structures.`
    )
  }
  if (seenProps.has(schema)) {
    return
  }
  propPath.push(schema.kind)
  try {
    seenProps.add(schema)
    if (schema.kind === 'array') {
      assertValidComponentSchemaInner(schema.element, [], propPath, seenProps, lists, mode)
      return
    }
    if (schema.kind === 'object') {
      schemaAncestors.push(schema)
      for (const [key, innerProp] of Object.entries(schema.fields)) {
        propPath.push(key)
        if (schema.fields[key] !== innerProp) {
          throw new Error(
            `Fields on an object field must not change over time but the field at "${propPath.join(
              '.'
            )}" changes between accesses`
          )
        }
        assertValidComponentSchemaInner(
          innerProp,
          schemaAncestors,
          propPath,
          seenProps,
          lists,
          mode
        )
        propPath.pop()
      }
      schemaAncestors.pop()
      return
    }
    if (schema.kind === 'conditional') {
      schemaAncestors.push(schema)
      const stringifiedDefaultDiscriminant = schema.discriminant.defaultValue.toString()
      for (const [key, innerProp] of Object.entries(schema.values)) {
        propPath.push(key)
        if (schema.values[key] !== innerProp) {
          throw new Error(
            `Fields on a conditional field must not change over time but the field at "${propPath.join(
              '.'
            )}" changes between accesses`
          )
        }
        assertValidComponentSchemaInner(
          innerProp,
          key === stringifiedDefaultDiscriminant ? schemaAncestors : [],
          propPath,
          seenProps,
          lists,
          mode
        )
        propPath.pop()
      }
      schemaAncestors.pop()
      return
    }
  } finally {
    propPath.pop()
  }
  assertNever(schema)
}
