import React from 'react'
import { render } from '@testing-library/react'
import { LoadingProvider } from '@/contexts/LoadingContext'

const customRender = (ui: React.ReactElement, options = {}) =>
    render(
        <LoadingProvider>
            {ui}
        </LoadingProvider>,
        { ...options }
    )

export * from '@testing-library/react'
export { customRender as render }
