import { useEffect, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { readTextFileFromRepo, putFile } from '@/lib/github-client'
import { toBase64Utf8 } from '@/lib/github-client'
import yaml from 'js-yaml'

// Common social icons mapping
const SOCIAL_PRESETS = [
    { label: 'Github', value: 'ri:github-line' },
    { label: 'Twitter (X)', value: 'ri:twitter-line' },
    { label: 'Bilibili', value: 'ri:bilibili-line' },
    { label: 'Email', value: 'ri:mail-line' },
    { label: 'Telegram', value: 'ri:telegram-line' },
    { label: 'RSS', value: 'ri:rss-fill' },
    { label: 'Weibo', value: 'ri:weibo-line' },
    { label: 'Zhihu', value: 'ri:zhihu-line' },
    { label: 'Other', value: 'ri:link' }
]

export function ConfigPage() {
	const [configContent, setConfigContent] = useState('')
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
    const [mode, setMode] = useState<'visual' | 'code'>('visual')
    const [parsedConfig, setParsedConfig] = useState<any>(null)

	useEffect(() => {
		loadConfig()
	}, [])

    useEffect(() => {
        if (configContent && mode === 'visual') {
            try {
                const parsed = yaml.load(configContent)
                setParsedConfig(parsed)
            } catch (e) {
                console.error(e)
                toast.error('YAML 解析失败，已切换回代码模式')
                setMode('code')
            }
        }
    }, [configContent, mode])

	const loadConfig = async () => {
		try {
			setLoading(true)
			const token = await getAuthToken()
			const content = await readTextFileFromRepo(
				token,
				GITHUB_CONFIG.OWNER,
				GITHUB_CONFIG.REPO,
				'ryuchan.config.yaml',
				GITHUB_CONFIG.BRANCH
			)
			if (content) {
				setConfigContent(content)
                try {
                    setParsedConfig(yaml.load(content))
                } catch (e) {
                    setMode('code')
                }
			} else {
				toast.error('未找到配置文件')
			}
		} catch (error: any) {
			toast.error('加载配置失败: ' + error.message)
		} finally {
			setLoading(false)
		}
	}

    const updateConfigValue = (path: string, value: any) => {
        if (!parsedConfig) return
        const newConfig = JSON.parse(JSON.stringify(parsedConfig))
        const parts = path.split('.')
        let current = newConfig
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {}
            current = current[parts[i]]
        }
        current[parts[parts.length - 1]] = value
        setParsedConfig(newConfig)
        setConfigContent(yaml.dump(newConfig))
    }

    const handleSocialChange = (index: number, field: string, value: any) => {
        const social = [...(parsedConfig?.user?.sidebar?.social || [])]
        if (!social[index]) social[index] = {}
        social[index][field] = value
        
        // Auto-set title/ariaLabel if not set
        if (field === 'svg') {
            const preset = SOCIAL_PRESETS.find(p => p.value === value)
            if (preset) {
                if (!social[index].title) social[index].title = preset.label
                if (!social[index].ariaLabel) social[index].ariaLabel = preset.label
            }
        }
        
        updateConfigValue('user.sidebar.social', social)
    }

    const addSocial = () => {
        const social = [...(parsedConfig?.user?.sidebar?.social || [])]
        social.push({
            href: '',
            title: 'New Link',
            ariaLabel: 'New Link',
            svg: 'ri:link'
        })
        updateConfigValue('user.sidebar.social', social)
    }

    const removeSocial = (index: number) => {
        const social = [...(parsedConfig?.user?.sidebar?.social || [])]
        social.splice(index, 1)
        updateConfigValue('user.sidebar.social', social)
    }

    const moveSocial = (index: number, direction: 'up' | 'down') => {
        const social = [...(parsedConfig?.user?.sidebar?.social || [])]
        if (direction === 'up' && index > 0) {
            [social[index], social[index - 1]] = [social[index - 1], social[index]]
        } else if (direction === 'down' && index < social.length - 1) {
            [social[index], social[index + 1]] = [social[index + 1], social[index]]
        }
        updateConfigValue('user.sidebar.social', social)
    }

	const handleSave = async () => {
		try {
			setSaving(true)
            let contentToSave = configContent
            if (mode === 'visual' && parsedConfig) {
                contentToSave = yaml.dump(parsedConfig)
            }

			const token = await getAuthToken()
			await putFile(
				token,
				GITHUB_CONFIG.OWNER,
				GITHUB_CONFIG.REPO,
				'ryuchan.config.yaml',
				toBase64Utf8(contentToSave), // Base64 encode
				'update: ryuchan.config.yaml',
				GITHUB_CONFIG.BRANCH
			)
			toast.success('配置已更新！等待部署生效')
		} catch (error: any) {
			toast.error('保存配置失败: ' + error.message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="min-h-screen bg-base-100 pt-24 pb-12">
            <Toaster richColors position="top-center" />
			<div className="w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-xl dark:bg-zinc-900 flex flex-col overflow-hidden border border-zinc-100 dark:border-zinc-800">
				{/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">站点配置</h2>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            className={`btn btn-sm ${mode === 'visual' ? 'btn-ghost text-zinc-500' : 'btn-primary'}`}
                            onClick={() => setMode(mode === 'visual' ? 'code' : 'visual')}
                        >
                            {mode === 'visual' ? '预览' : '可视化'}
                        </button>
                        <button onClick={handleSave} disabled={saving || loading} className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none px-6">
                            {saving ? '保存中...' : '保存配置'}
                        </button>
                    </div>
				</div>

				{loading ? (
					<div className="flex h-64 items-center justify-center">加载中...</div>
				) : (
                    <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 p-6">
                        {mode === 'code' ? (
                            <textarea
                                className="h-[600px] w-full rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm text-zinc-900 focus:border-red-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 resize-none shadow-sm"
                                value={configContent}
                                onChange={(e) => setConfigContent(e.target.value)}
                                spellCheck={false}
                            />
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-8">
                                {/* Icons */}
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-3">
                                        <div className="text-sm text-zinc-500">网站图标</div>
                                        <div className="flex justify-center p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 ring-4 ring-white shadow-lg">
                                                <img src={parsedConfig?.site?.favicon || '/favicon.ico'} alt="Favicon" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="input input-sm input-bordered w-full text-center text-xs" 
                                            value={parsedConfig?.site?.favicon || ''}
                                            onChange={e => updateConfigValue('site.favicon', e.target.value)}
                                            placeholder="图标 URL"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-sm text-zinc-500">阿凡达 (Avatar)</div>
                                        <div className="flex justify-center p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 ring-4 ring-white shadow-lg">
                                                <img src={parsedConfig?.user?.avatar || '/avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="input input-sm input-bordered w-full text-center text-xs" 
                                            value={parsedConfig?.user?.avatar || ''}
                                            onChange={e => updateConfigValue('user.avatar', e.target.value)}
                                            placeholder="头像 URL"
                                        />
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="form-control w-full">
                                        <label className="label"><span className="label-text text-zinc-500">站点标题</span></label>
                                        <input type="text" className="input input-bordered w-full bg-zinc-100/50 border-transparent focus:bg-white focus:border-red-500 transition-all" 
                                            value={parsedConfig?.site?.title || ''} 
                                            onChange={e => updateConfigValue('site.title', e.target.value)} />
                                    </div>
                                    <div className="form-control w-full">
                                        <label className="label"><span className="label-text text-zinc-500">浏览器标签</span></label>
                                        <input type="text" className="input input-bordered w-full bg-zinc-100/50 border-transparent focus:bg-white focus:border-red-500 transition-all" 
                                            value={parsedConfig?.site?.tab || ''} 
                                            onChange={e => updateConfigValue('site.tab', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text text-zinc-500">站点描述</span></label>
                                    <textarea className="textarea textarea-bordered w-full h-24 bg-zinc-100/50 border-transparent focus:bg-white focus:border-red-500 transition-all resize-none" 
                                        value={parsedConfig?.site?.description || ''} 
                                        onChange={e => updateConfigValue('site.description', e.target.value)} />
                                </div>

                                {/* ICP Info */}
                                <div className="space-y-3">
                                    <div className="text-sm text-zinc-500">备案信息</div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <input type="text" className="input input-bordered w-full bg-zinc-100/50 border-transparent focus:bg-white focus:border-red-500 transition-all" 
                                            placeholder="例如：京ICP备12345678号"
                                            value={parsedConfig?.site?.beian?.number || ''} 
                                            onChange={e => updateConfigValue('site.beian.number', e.target.value)} />
                                        <input type="text" className="input input-bordered w-full bg-zinc-100/50 border-transparent focus:bg-white focus:border-red-500 transition-all" 
                                            placeholder="https://beian.miit.gov.cn/"
                                            value={parsedConfig?.site?.beian?.link || ''} 
                                            onChange={e => updateConfigValue('site.beian.link', e.target.value)} />
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="space-y-3">
                                    <div className="text-sm text-zinc-500">社交按钮</div>
                                    <div className="space-y-2">
                                        {(parsedConfig?.user?.sidebar?.social || []).map((item: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 group">
                                                <select 
                                                    className="select select-bordered select-sm w-32 bg-white"
                                                    value={SOCIAL_PRESETS.find(p => p.value === item.svg)?.value || 'custom'}
                                                    onChange={e => {
                                                        if (e.target.value !== 'custom') {
                                                            handleSocialChange(index, 'svg', e.target.value)
                                                        }
                                                    }}
                                                >
                                                    {SOCIAL_PRESETS.map(p => (
                                                        <option key={p.value} value={p.value}>{p.label}</option>
                                                    ))}
                                                    <option value="custom">Custom</option>
                                                </select>
                                                
                                                <input 
                                                    type="text" 
                                                    className="input input-sm input-bordered flex-1 bg-zinc-100/50 focus:bg-white transition-all"
                                                    placeholder="链接地址"
                                                    value={item.href}
                                                    onChange={e => handleSocialChange(index, 'href', e.target.value)}
                                                />

                                                <div className="join bg-zinc-100 rounded-lg p-1">
                                                    <div className="w-8 h-6 flex items-center justify-center text-xs font-mono text-zinc-500">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => moveSocial(index, 'up')} className="btn btn-xs btn-ghost btn-square" disabled={index === 0}>↑</button>
                                                    <button onClick={() => moveSocial(index, 'down')} className="btn btn-xs btn-ghost btn-square" disabled={index === (parsedConfig?.user?.sidebar?.social?.length || 0) - 1}>↓</button>
                                                    <button onClick={() => removeSocial(index)} className="btn btn-xs btn-ghost btn-square text-red-500">✕</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addSocial} className="btn btn-ghost btn-sm w-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
                                        + 添加按钮
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
				)}
			</div>
		</div>
	)
}
