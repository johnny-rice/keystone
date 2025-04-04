/** @jsxImportSource @emotion/react */

'use client'

import { Highlight, Prism, type LineOutputProps, type TokenOutputProps } from 'prism-react-renderer'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

import theme from '../../lib/prism-theme'

type Range = { start: number; end: number }
type CollapseRange = Range & { isCollapsed: boolean }

const getRanges = (lines: string): Range[] => {
  const ranges: Range[] = []

  lines.split(',').forEach(lineRange => {
    if (lineRange.length) {
      const [range1, range2] = lineRange.split('-')

      let parsedRange1 = parseInt(range1)
      const parsedRange2 = parseInt(range2)

      if (isNaN(parsedRange1)) {
        throw new Error(`When trying to do highlighting, error in {${lines}}`)
      }

      if (!isNaN(parsedRange2)) {
        ranges.push({ start: parsedRange1 - 1, end: parsedRange2 - 1 })
        while (parsedRange1 <= parsedRange2) {
          parsedRange1++
        }
      } else {
        ranges.push({ start: parsedRange1 - 1, end: parsedRange1 - 1 })
      }
    }
  })

  return ranges
}

const parseClassName = (
  className?: string
): { highlightRanges: Range[]; collapseRanges: CollapseRange[]; language: string } => {
  const trimmedLanguage = (className || '').replace(/language-/, '')
  let language, highlights, collapses

  if (
    !trimmedLanguage.includes('[') ||
    trimmedLanguage.indexOf('{') < trimmedLanguage.indexOf('[')
  ) {
    const [scopedLanguage, modifiers = ''] = trimmedLanguage.split('{')

    const [scopedHighlights, scopedCollapses] = modifiers.split('[')

    language = scopedLanguage
    highlights = scopedHighlights
    collapses = scopedCollapses
  } else {
    const [scopedLanguage, modifiers = ''] = trimmedLanguage.split('[')

    const [scopedCollapses, scopedHighlights] = modifiers.split('{')

    language = scopedLanguage
    highlights = scopedHighlights
    collapses = scopedCollapses
  }

  return {
    language: (language as any) || 'typescript',
    highlightRanges: getRanges(highlights?.replace('}', '') || ''),
    collapseRanges: getRanges(collapses?.replace(']', '') || '').map(range => ({
      ...range,
      isCollapsed: true,
    })),
  }
}

const findRange = <TRange extends Range | CollapseRange>(
  ranges: TRange[],
  num: number
): TRange | undefined => ranges.find(({ start, end }) => start <= num && end >= num)

export function CodeBlock(props: { children: string; className?: string }) {
  /*
    In MDX 2, we no longer get different components for rendering `inlineCode` and code blocks.
    This function returns us to our old behaviour, though a bit inelegantly
  */
  if (props.children.includes('\n')) {
    return <Code {...props} />
  }
  return <InlineCode {...props} />
}

export function Code({ children, className }: { children: string; className?: string }) {
  const { language, highlightRanges, collapseRanges } = useMemo(
    () => parseClassName(className),
    [className]
  )

  const [collapseState, updateCollapseState] = useState<CollapseRange[]>(collapseRanges)

  useEffect(() => {
    updateCollapseState(collapseRanges)
  }, [collapseRanges])

  return (
    <Highlight prism={Prism} code={children.trim()} language={language} theme={theme}>
      {({ className, style, tokens: tokens, getLineProps, getTokenProps }) => {
        return (
          <div
            className={className}
            css={{
              ...style,
              backgroundColor: 'transparent',
            }}
          >
            {tokens.map((line, i) => {
              if (collapseState.find(({ start }) => start === i)?.isCollapsed) {
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const updated = collapseState.map(item =>
                        item.start === i ? { ...item, isCollapsed: false } : item
                      )

                      updateCollapseState(updated)
                    }}
                    css={{
                      border: 'inherit',
                      background: 'var(--info-bg)',
                      ':hover': {
                        background: 'var(--warning-bg)',
                      },
                    }}
                  >
                    ...
                  </button>
                )
              }

              if (findRange(collapseState, i)?.isCollapsed) {
                return undefined
              }

              // Need to extract the key from lineProps, React not happy about spreading a key on an element
              const lineProps = getLineProps({ line, key: i })
              const { key, ...restLineProps } = lineProps
              return (
                <div
                  key={i}
                  {...restLineProps}
                  css={{
                    ...(findRange(highlightRanges, i) && {
                      backgroundColor: 'var(--info-bg)',
                      margin: '0 -1.1em',
                      padding: '0 1.1em',
                      borderLeft: '3px solid var(--info)',
                      marginRight: '-1.0em',
                      paddingLeft: 'calc(1.1em - 3px)',
                    }),
                    ':before': {
                      content: `"${i + 1}"`,
                      width: 24,
                      display: 'inline-block',
                    },
                  }}
                >
                  {line.map((token, key) => {
                    // Fix for document field import
                    if (token.content === 'document' && token.types[0] === 'imports') {
                      token.types = ['imports']
                    }

                    // Need to extract the key from lineProps, React not happy about spreading a key on an element
                    const tokenProps = getTokenProps({ token, key })
                    const { key: k, ...restTokenProps } = tokenProps
                    return <span key={key} {...restTokenProps} />
                  })}
                </div>
              )
            })}
          </div>
        )
      }}
    </Highlight>
  )
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      css={{
        display: 'inline-block',
        color: 'var(--code)',
        background: 'var(--code-bg)',
        padding: '0 var(--space-medium)',
        margin: 0,
        border: '1px solid var(--border)',
        borderRadius: '5px',
        fontSize: '85%',
        fontFamily: 'var(--font-mono)',
        wordBreak: 'break-all',
      }}
    >
      {children}
    </code>
  )
}
