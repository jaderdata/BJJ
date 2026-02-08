import React from 'react'
import { render } from '@testing-library/react'

const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }
