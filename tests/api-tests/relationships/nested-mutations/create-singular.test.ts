import { gen, sampleOne } from 'testcheck'
import { text, relationship } from '@keystone-6/core/fields'
import { list } from '@keystone-6/core'
import { allOperations, allowAll } from '@keystone-6/core/access'

import { setupTestRunner } from '../../test-runner'
import { expectGraphQLValidationError, expectSingleRelationshipError } from '../../utils'

const runner = setupTestRunner({
  serve: true,
  config: {
    lists: {
      Group: list({
        access: allowAll,
        fields: {
          name: text(),
        },
      }),

      Event: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'Group' }),
        },
      }),

      GroupNoRead: list({
        access: { operation: { ...allOperations(allowAll), query: () => false } },
        fields: {
          name: text(),
        },
      }),

      EventToGroupNoRead: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoRead' }),
        },
      }),

      GroupNoReadHard: list({
        access: allowAll,
        fields: {
          name: text(),
        },
        graphql: { omit: { query: true } },
      }),

      EventToGroupNoReadHard: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoReadHard' }),
        },
      }),

      GroupNoCreate: list({
        access: { operation: { ...allOperations(allowAll), create: () => false } },
        fields: {
          name: text(),
        },
      }),

      EventToGroupNoCreate: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoCreate' }),
        },
      }),

      GroupNoCreateHard: list({
        access: allowAll,
        fields: {
          name: text(),
        },
        graphql: { omit: { create: true } },
      }),

      EventToGroupNoCreateHard: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoCreateHard' }),
        },
      }),

      GroupNoUpdate: list({
        access: { operation: { ...allOperations(allowAll), update: () => false } },
        fields: {
          name: text(),
        },
      }),

      EventToGroupNoUpdate: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoUpdate' }),
        },
      }),

      GroupNoUpdateHard: list({
        access: allowAll,
        fields: {
          name: text(),
        },
        graphql: { omit: { update: true } },
      }),

      EventToGroupNoUpdateHard: list({
        access: allowAll,
        fields: {
          title: text(),
          group: relationship({ ref: 'GroupNoUpdateHard' }),
        },
      }),
    },
  },
})

describe('no access control', () => {
  test(
    'create nested from within create mutation',
    runner(async ({ context }) => {
      const groupName = sampleOne(gen.alphaNumString.notEmpty())

      // Create an item that does the nested create
      const event = await context.query.Event.createOne({
        data: { title: 'A thing', group: { create: { name: groupName } } },
        query: 'id group { id name }',
      })

      expect(event).toMatchObject({
        id: expect.any(String),
        group: { id: expect.any(String), name: groupName },
      })

      const group = await context.query.Group.findOne({
        where: { id: event.group.id },
        query: 'id name',
      })
      expect(group).toMatchObject({ id: event.group.id, name: groupName })
    })
  )

  test(
    'create nested from within update mutation',
    runner(async ({ context }) => {
      const groupName = sampleOne(gen.alphaNumString.notEmpty())

      // Create an item to update
      const createEvent = await context.query.Event.createOne({ data: { title: 'A thing' } })

      // Update an item that does the nested create
      const event = await context.query.Event.updateOne({
        where: { id: createEvent.id },
        data: { title: 'A thing', group: { create: { name: groupName } } },
        query: 'id group { id name }',
      })

      expect(event).toMatchObject({
        id: expect.any(String),
        group: { id: expect.any(String), name: groupName },
      })

      const group = await context.query.Group.findOne({
        where: { id: event.group.id },
        query: 'id name',
      })
      expect(group).toMatchObject({ id: event.group.id, name: groupName })
    })
  )
})

describe('with access control', () => {
  ;(
    [
      { name: 'GroupNoRead', allowed: true, func: 'read: () => false' },
      { name: 'GroupNoReadHard', allowed: true, func: 'query: false' },
      { name: 'GroupNoCreate', allowed: false, func: 'create: () => false' },
      { name: 'GroupNoCreateHard', allowed: false, func: 'create: false' },
      { name: 'GroupNoUpdate', allowed: true, func: 'update: () => false' },
      { name: 'GroupNoUpdateHard', allowed: true, func: 'update: false' },
    ] as const
  ).forEach(group => {
    describe(`${group.func} on related list`, () => {
      if (group.allowed) {
        test(
          'does not throw error when creating nested within create mutation',
          runner(async ({ context }) => {
            const groupName = sampleOne(gen.alphaNumString.notEmpty())

            // Create an item that does the nested create{
            const data = await context.query[`EventTo${group.name}`].createOne({
              data: { title: 'A thing', group: { create: { name: groupName } } },
            })

            expect(data).toMatchObject({ id: expect.any(String) })

            // See that it actually stored the group ID on the Event record
            const event = await context.sudo().query[`EventTo${group.name}`].findOne({
              where: { id: data.id },
              query: 'id group { id name }',
            })
            expect(event).toBeTruthy()
            expect(event!.group).toBeTruthy()
            expect(event!.group.name).toBe(groupName)
          })
        )

        test(
          'does not throw error when creating nested within update mutation',
          runner(async ({ context }) => {
            const groupName = sampleOne(gen.alphaNumString.notEmpty())

            // Create an item to update
            const eventModel = await context.query[`EventTo${group.name}`].createOne({
              data: { title: 'A thing' },
            })

            // Update an item that does the nested create
            const data = await context.query[`EventTo${group.name}`].updateOne({
              where: { id: eventModel.id },
              data: { title: 'A thing', group: { create: { name: groupName } } },
            })

            expect(data).toMatchObject({ id: expect.any(String) })

            // See that it actually stored the group ID on the Event record
            const event = await context.sudo().query[`EventTo${group.name}`].findOne({
              where: { id: data.id },
              query: 'id group { id name }',
            })
            expect(event).toBeTruthy()
            expect(event!.group).toBeTruthy()
            expect(event!.group.name).toBe(groupName)
          })
        )
      } else {
        test(
          'throws error when creating nested within create mutation',
          runner(async ({ context, gqlSuper }) => {
            const alphaNumGenerator = gen.alphaNumString.notEmpty()
            const eventName = sampleOne(alphaNumGenerator)
            const groupName = sampleOne(alphaNumGenerator)

            // Create an item that does the nested create
            const query = `
              mutation {
                createEventTo${group.name}(data: {
                  title: "${eventName}",
                  group: { create: { name: "${groupName}" } }
                }) {
                  id
                }
              }`

            if (group.name === 'GroupNoCreateHard') {
              const { body } = await gqlSuper({ query })

              // For { create: false } the mutation won't even exist, so we expect a different behaviour
              expectGraphQLValidationError(body.errors, [
                {
                  message: `Field "create" is not defined by type "${group.name}RelateToOneForCreateInput".`,
                },
              ])
            } else {
              const { data, errors } = await context.graphql.raw({ query })

              // Assert it throws an access denied error
              expect(data).toEqual({ [`createEventTo${group.name}`]: null })
              const message = `Access denied: You cannot create that GroupNoCreate`
              expectSingleRelationshipError(
                errors,
                `createEventTo${group.name}`,
                `EventTo${group.name}.group`,
                message
              )
            }
            // Confirm it didn't insert either of the records anyway
            const data1 = await context.sudo().query[group.name].findMany({
              where: { name: { equals: groupName } },
              query: 'id name',
            })
            expect(data1).toMatchObject([])

            // Confirm it didn't insert either of the records anyway
            const data2 = await context.sudo().query[`EventTo${group.name}`].findMany({
              where: { title: { equals: eventName } },
              query: 'id title',
            })
            expect(data2).toMatchObject([])
          })
        )

        test(
          'throws error when creating nested within update mutation',
          runner(async ({ context, gql, gqlSuper }) => {
            const groupName = sampleOne(gen.alphaNumString.notEmpty())

            // Create an item to update
            const eventModel = await context.query[`EventTo${group.name}`].createOne({
              data: { title: 'A thing' },
            })

            // Update an item that does the nested create
            const query = `
              mutation {
                updateEventTo${group.name}(
                  where: { id: "${eventModel.id}" }
                  data: {
                    title: "A thing",
                    group: { create: { name: "${groupName}" } }
                  }
                ) {
                  id
                }
              }`

            // Assert it throws an access denied error
            if (group.name === 'GroupNoCreateHard') {
              const { body } = await gqlSuper({ query })
              // For { create: false } the mutation won't even exist, so we expect a different behaviour

              expectGraphQLValidationError(body.errors, [
                {
                  message: `Field "create" is not defined by type "${group.name}RelateToOneForUpdateInput".`,
                },
              ])
            } else {
              const { data, errors } = await context.graphql.raw({ query })
              expect(data).toEqual({ [`updateEventTo${group.name}`]: null })
              const message = `Access denied: You cannot create that GroupNoCreate`
              expectSingleRelationshipError(
                errors,
                `updateEventTo${group.name}`,
                `EventTo${group.name}.group`,
                message
              )
            }

            // Confirm it didn't insert the record anyway
            const groups = await context.sudo().query[group.name].findMany({
              where: { name: { equals: groupName } },
              query: 'id name',
            })
            expect(groups).toMatchObject([])
          })
        )
      }
    })
  })
})
