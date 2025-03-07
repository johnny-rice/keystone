import React, { useId } from 'react'
import { ButtonGroup, Button } from '@keystar/ui/button'
import { Dialog, useDialogContainer } from '@keystar/ui/dialog'
import { Box } from '@keystar/ui/layout'
import { Content } from '@keystar/ui/slots'
import { Heading } from '@keystar/ui/typography'

import { useList } from '../context'

import { Fields } from '../utils/Fields'
import { useBuildItem } from '../utils/useCreateItem'

export function BuildItemDialog({
  listKey,
  onChange,
}: {
  listKey: string
  onChange: (subItem: Record<string, unknown>) => void
}) {
  const list = useList(listKey)
  const builder = useBuildItem(list)
  const dialogState = useDialogContainer()
  const formId = useId()

  return (
    <Dialog>
      <Heading>Add {list.singular}</Heading>

      <Content>
        <form
          id={formId}
          onSubmit={async e => {
            e.preventDefault()

            // NOTE: React events bubble through portals, this prevents the
            // parent form being submitted.
            e.stopPropagation()

            const subItem = await builder.build()
            if (!subItem) return

            onChange(subItem)
            dialogState.dismiss()
          }}
        >
          <Box paddingY="xlarge">
            <Fields {...builder.props} />
          </Box>
        </form>
      </Content>

      <ButtonGroup>
        <Button onPress={dialogState.dismiss}>Cancel</Button>
        <Button form={formId} prominence="high" type="submit">
          Add
        </Button>
      </ButtonGroup>
    </Dialog>
  )
}
