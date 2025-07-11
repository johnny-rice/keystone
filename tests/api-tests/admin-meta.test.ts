import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { integer, text } from '@keystone-6/core/fields'
import { setupTestRunner } from '@keystone-6/api-tests/test-runner'
import { adminMetaQuery } from '../../packages/core/src/admin-ui/admin-meta-graphql'
import { dbProvider } from './utils'

const runner = setupTestRunner({
  config: {
    ui: {
      isAccessAllowed: () => false,
    },
    lists: {
      User: list({
        access: allowAll,
        ui: {
          createView: { defaultFieldMode: 'hidden' },
          itemView: { defaultFieldMode: 'read' },
          listView: { defaultFieldMode: 'hidden' },
        },
        fields: {
          name: text({
            ui: {
              createView: {
                fieldMode: 'edit',
              },
              itemView: { fieldMode: 'hidden' },
              listView: { fieldMode: 'read' },
            },
          }),
          something: integer(),
        },
      }),
    },
  },
})

test(
  'non-sudo context does not bypass isAccessAllowed for admin meta',
  runner(async ({ context }) => {
    const res = await context.graphql.raw({ query: adminMetaQuery })
    expect(res).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          [GraphQLError: Access denied],
        ],
      }
    `)
  })
)

test(
  'sudo context bypasses isAccessAllowed for admin meta',
  runner(async ({ context }) => {
    const data = await context.sudo().graphql.run({ query: adminMetaQuery })
    expect(data).toEqual({
      keystone: {
        adminMeta: {
          lists: [
            {
              description: null,
              fields: [
                {
                  createView: {
                    fieldMode: 'hidden',
                    isRequired: false,
                  },
                  isFilterable: true,
                  isOrderable: true,
                  listView: {
                    fieldMode: 'hidden',
                  },
                  customViewsIndex: null,
                  description: null,
                  fieldMeta: {
                    kind: 'cuid',
                    type: 'String',
                  },
                  isNonNull: [],
                  itemView: {
                    fieldMode: 'read',
                    fieldPosition: 'sidebar',
                    isRequired: false,
                  },
                  label: 'Id',
                  path: 'id',
                  search: null,
                  viewsIndex: 0,
                },
                {
                  createView: {
                    fieldMode: 'edit',
                    isRequired: false,
                  },
                  isFilterable: true,
                  isOrderable: true,
                  listView: {
                    fieldMode: 'read',
                  },
                  customViewsIndex: null,
                  description: null,
                  fieldMeta: {
                    defaultValue: '',
                    displayMode: 'input',
                    isNullable: false,
                    shouldUseModeInsensitive: dbProvider === 'postgresql',
                    validation: {
                      length: {
                        max: null,
                        min: null,
                      },
                      match: null,
                    },
                  },
                  isNonNull: [],
                  itemView: {
                    fieldMode: 'hidden',
                    fieldPosition: 'form',
                    isRequired: false,
                  },
                  label: 'Name',
                  path: 'name',
                  search: dbProvider === 'postgresql' ? 'insensitive' : 'default',
                  viewsIndex: 1,
                },
                {
                  createView: {
                    fieldMode: 'hidden',
                    isRequired: false,
                  },
                  isFilterable: true,
                  isOrderable: true,
                  listView: {
                    fieldMode: 'hidden',
                  },
                  customViewsIndex: null,
                  description: null,
                  fieldMeta: {
                    defaultValue: null,
                    validation: {
                      max: 2147483647,
                      min: -2147483648,
                    },
                  },
                  isNonNull: [],
                  itemView: {
                    fieldMode: 'read',
                    fieldPosition: 'form',
                    isRequired: false,
                  },
                  label: 'Something',
                  path: 'something',
                  search: null,
                  viewsIndex: 2,
                },
              ],
              graphql: {
                names: {
                  createInputName: 'UserCreateInput',
                  createManyMutationName: 'createUsers',
                  createMutationName: 'createUser',
                  deleteManyMutationName: 'deleteUsers',
                  deleteMutationName: 'deleteUser',
                  itemQueryName: 'user',
                  listOrderName: 'UserOrderByInput',
                  listQueryCountName: 'usersCount',
                  listQueryName: 'users',
                  outputTypeName: 'User',
                  relateToManyForCreateInputName: 'UserRelateToManyForCreateInput',
                  relateToManyForUpdateInputName: 'UserRelateToManyForUpdateInput',
                  relateToOneForCreateInputName: 'UserRelateToOneForCreateInput',
                  relateToOneForUpdateInputName: 'UserRelateToOneForUpdateInput',
                  updateInputName: 'UserUpdateInput',
                  updateManyInputName: 'UserUpdateArgs',
                  updateManyMutationName: 'updateUsers',
                  updateMutationName: 'updateUser',
                  whereInputName: 'UserWhereInput',
                  whereUniqueInputName: 'UserWhereUniqueInput',
                },
              },
              groups: [],
              hideCreate: false,
              hideDelete: false,
              hideNavigation: false,
              initialColumns: ['name', 'something'],
              initialSearchFields: ['name'],
              initialSort: null,
              initialFilter: {},
              key: 'User',
              label: 'Users',
              labelField: 'name',
              pageSize: 50,
              path: 'users',
              plural: 'Users',
              singular: 'User',
              isSingleton: false,
            },
          ],
        },
      },
    })
  })
)

const names = {
  label: 'Test Stuff',
  plural: 'Test Things',
  singular: 'Test Thing',
  path: 'thing',
}

const gql = ([content]: TemplateStringsArray) => content

const runner2 = setupTestRunner({
  config: {
    lists: {
      Test: list({
        access: allowAll,
        fields: { name: text() },
        ui: names,
      }),
    },
  },
})

test(
  'ui.{label,plural,singular,path} are returned in the admin meta',
  runner2(async ({ context }) => {
    const res = await context.sudo().graphql.raw({
      query: gql`
        query {
          keystone {
            adminMeta {
              list(key: "Test") {
                label
                singular
                plural
                path
              }
            }
          }
        }
      `,
    })
    expect(res.data!).toEqual({
      keystone: { adminMeta: { list: names } },
    })
  })
)

test(
  'listView and createView',
  runner(async ({ context }) => {
    const data = await context.sudo().graphql.run({
      query: gql`
        query {
          keystone {
            adminMeta {
              lists {
                key
                fields {
                  path
                  createView {
                    fieldMode
                  }
                  listView {
                    fieldMode
                  }
                }
              }
            }
          }
        }
      `,
    })
    expect(data).toMatchInlineSnapshot(`
      {
        "keystone": {
          "adminMeta": {
            "lists": [
              {
                "fields": [
                  {
                    "createView": {
                      "fieldMode": "hidden",
                    },
                    "listView": {
                      "fieldMode": "hidden",
                    },
                    "path": "id",
                  },
                  {
                    "createView": {
                      "fieldMode": "edit",
                    },
                    "listView": {
                      "fieldMode": "read",
                    },
                    "path": "name",
                  },
                  {
                    "createView": {
                      "fieldMode": "hidden",
                    },
                    "listView": {
                      "fieldMode": "hidden",
                    },
                    "path": "something",
                  },
                ],
                "key": "User",
              },
            ],
          },
        },
      }
    `)
  })
)
