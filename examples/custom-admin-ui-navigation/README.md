## Feature Example - Custom Admin UI Navigation

This project demonstrates how to create a custom Navigation component for use in the Admin UI. It builds on the [Task Manager](../task-manager) starter project.

## Instructions

To run this project, clone the Keystone repository locally, run `pnpm install` at the root of the repository then navigate to this directory and run:

```shell
pnpm dev
```

This will start the Admin UI at [localhost:3000](http://localhost:3000).

You can use the Admin UI to create items in your database.

You can also access a GraphQL Playground at [localhost:3000/api/graphql](http://localhost:3000/api/graphql), which allows you to directly run GraphQL queries and mutations.

## admin/config.ts

The project contains an `config.ts` file in the `/admin` directory at its root. Keystone looks for this file for component customisations, and expects the following export.

```typescript
export const components = {
  Logo,
  Navigation,
}
```

The exported components object is expected to have the following type signature:

```typescript
{
    Logo?: (props: {}) => ReactElement
    Navigation?: (props: NavigationProps) => ReactElement
}
```

Keystone conveniently exports an AdminConfig type for DX.

```typescript
import { AdminConfig } from '@keystone-6/core/types'
export const components: AdminConfig['components'] = {
  Logo,
  Navigation,
}
```

## NavigationProps

Keystone passes the following props to your custom Navigation component:

```typescript
   NavigationProps = {
    lists: ListMeta[]
   }
```

### lists prop

The `lists` prop is an array of keystone list objects.

```typescript
type ListMeta = {
  /** Used for optimising the generated list of NavItems in React */
  key: string
  /** Used as the href for each list generated NavItem */
  path: string
  /** Used as the label for each list generated NavItem */
  label: string
  /** Other properties exists, but these are the ones that are relevant to the Navigation implementation */
}

type Lists = ListMeta[]
```

## Navigation components

Keystone exports the following components to make creating your own custom Navigation component easier. These are:

- NavigationContainer: A generic container element
- ListNavItems: This component renders out a list of Nav Items with preconfigured route matching logic optimised for lists.
- NavItem: A thin styling and accessibility wrapper around the Next.js `Link` component.

### NavigationContainer

The NavigationContainer is responsible for rendering semantic markup and styles for the containing element around your navigation items.

```typescript
type NavigationContainerProps = {
  children: ReactNode
}

const CustomNavigation = () => {
  return (
    <NavigationContainer>
      {/* the rest goes here */}
    </NavigationContainer>
  )
}
```

### ListNavItems

```ts
type ListNavItemsProps = {
  lists: ListMeta[]
  include?: string[]
}
```

The ListNavItems component expects `lists` an array of list objects and renders a list of NavItems. It also optionally takes `include`, an array of strings. If this array is passed to this component, only lists with a `key` property that matches an element in the `include` array will be rendered. If this array is not passed into the component, all lists will be rendered.

### ListNavItem

```typescript
type ListNavItemProps = {
  list: ListMeta
}
```

The ListNavItem component takes a single `list` object and renders a `NavItem`. This is a thin wrapper around `NavItem`, that automates the association of list properties to NavItem. It also adds a custom `isSelected` expression optimised for keystone lists.

The idea behind `ListNavItem` is to have a higher-level abstraction that makes it easier to render navigation links for lists consistently.
This is especially relevant for future feature additions to the nav. (i.e. if we add icon support, that would work out of the box from a dependency bump for users of ListNavItem, whereas you'd have to add that icon prop manually with a lower level component.)

### NavItem

The NavItem component has the following type signature:

```typescript
type NavItemProps = {
  children: ReactNode
  href: string
  isSelected?: boolean
}
```

By default the `isSelected` value if left undefined, will be evaluated by the condition `router.pathname === href`, pass in `isSelected` if you have a custom condition or would like more granular control over the selected state of Navigation items.

See also the [Custom Navigation guide](httpes://keystonejs.com/docs/guides/custom-admin-ui-navigation).

## Try it out in CodeSandbox 🧪

You can play with this example online in a web browser using the free [codesandbox.io](https://codesandbox.io/) service. To launch this example, open the URL <https://githubbox.com/keystonejs/keystone/tree/main/examples/custom-admin-ui-navigation>. You can also fork this sandbox to make your own changes.
