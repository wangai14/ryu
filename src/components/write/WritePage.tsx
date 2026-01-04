'use client'

import { useWriteStore } from './stores/write-store'
import { usePreviewStore } from './stores/preview-store'
import { WriteEditor } from './components/editor'
import { WriteSidebar } from './components/sidebar'
import { WriteActions } from './components/actions'
import { WritePreview } from './components/preview'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useLoadBlog } from './hooks/use-load-blog'

export default function WritePage() {
	const { form, cover, reset } = useWriteStore()
	const { isPreview, closePreview } = usePreviewStore()
    const [slug, setSlug] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const s = params.get('slug')
        if (s) {
            setSlug(s)
        } else {
            reset()
        }
    }, [])

    const { loading } = useLoadBlog(slug || undefined)

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

    if (loading) {
		return <div className='text-secondary flex h-screen items-center justify-center text-sm'>加载中...</div>
	}

	return (
        <>
            <Toaster richColors position="top-center" />
            {isPreview ? (
                <WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} slug={slug || undefined} />
            ) : (
                <>
                    <div className='flex h-full justify-center gap-6 px-6 pt-24 pb-12'>
                        <WriteEditor />
                        <WriteSidebar />
                    </div>

                    <WriteActions />
                </>
            )}
        </>
	)
}
