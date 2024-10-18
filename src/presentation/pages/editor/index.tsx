import { useParams } from 'react-router-dom'
import { Directory } from '../../../domain/entities/Directory'
import { MonacoEditorWrapper } from '../../components/MonacoEditorWrapper'
import { SideExplorer } from '../../components/SideExplorer'
import { useFolderAdapter } from '../../../adapters/DirectoryAdapter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderStatus } from '../../../domain/repositories/DirectoryState'
import { FloatingPanel, FloatingPanelRef } from 'antd-mobile'
import { Tabs, TabsProps } from 'antd'
import { useWindowSize } from 'react-use'
import { SubNav } from '../../components/Nav/SubNav'
import style from './index.module.scss'


type TargetKey = React.MouseEvent | React.KeyboardEvent | string

export function EditorPage() {

  const { parentId, folderId, fileId } = useParams()
  let workspace: Pick<Directory.FolderMetadata, 'parentId' | 'id'> = Directory.RootNode

  if (parentId && folderId) {
    workspace = { parentId: parentId, id: folderId, }
  }

  const [files, setFiles] = useState<NonNullable<TabsProps['items']>>([])
  const [activeFileKey, setActiveFileKey] = useState<string>()

  const { fetchFolderMetadata, fetchFolderContent, folderStatus, folderMetadata, folderContent, createFile } = useFolderAdapter(workspace)
  useEffect(fetchFolderMetadata, [])
  useEffect(fetchFolderContent, [])

  const openFile = useMemo(() => (file: Directory.FileMetadata, dynamicPosition = true) => {
    const targetIndex = files.findIndex((pane) => pane.key === file.id)

    if (targetIndex === -1) {
      let activeIndex = files.findIndex((pane) => pane.key === activeFileKey)
      if (activeIndex === -1 || !dynamicPosition) activeIndex = files.length - 1

      setFiles([
        ...files.slice(0, activeIndex + 1),
        {
          key: file.id,
          label: file.name,
          children: <MonacoEditorWrapper fileMetadata={file} />,
        },
        ...files.slice(activeIndex + 1),
      ])

    }

    setActiveFileKey(file.id)

    return


  }, [files, activeFileKey])

  const closeFile = useMemo(() => (targetKey: TargetKey) => {
    const targetIndex = files.findIndex((pane) => pane.key === targetKey)
    const newPanes = files.filter((pane) => pane.key !== targetKey)
    if (newPanes.length && targetKey === targetKey) {
      const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex]
      setActiveFileKey(key)
    }
    setFiles(newPanes)
    return

  }, [files])

  useEffect(() => {
    folderContent.forEach(node => {
      if (node.type === Directory.NodeType.file && node.id === fileId) openFile(node)
    })
  }, [folderContent.length])

  const anchors = [100, window.innerHeight * 0.6]
  const ref = useRef<FloatingPanelRef>(null)
  const { width: windowWidth } = useWindowSize()

  const onChange = (key: string) => {
    setActiveFileKey(key)
  }

  const onEdit = async (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      const filename = prompt('Enter File Name')
      if (filename) {
        const file = await createFile({ name: filename })
        openFile(file, false)
      }
    } else {
      closeFile(targetKey)
    }
  }

  if (folderStatus == FolderStatus.Loading) {
    return <p>Loading...</p>
  }

  if (folderMetadata === undefined) {
    return <p>Could not Find Folder</p>
  }

  return (
    <div className={style.container}>
      {
        windowWidth >= 800
          ? <SubNav title='Editor' className={style.sideNav}>
            <SideExplorer workspace={folderMetadata} openFile={openFile} />
          </SubNav>
          : <FloatingPanel anchors={anchors} ref={ref}>
            <div style={{ padding: '0 16px 16px 16px' }}>
              <SideExplorer workspace={folderMetadata} openFile={openFile} />
            </div>
          </FloatingPanel>
      }
      <Tabs
        className={style.editorArea}
        onChange={onChange}
        activeKey={activeFileKey}
        type="editable-card"
        onEdit={onEdit}
        items={files}
        tabBarGutter={0}
      />
    </div>
  )
}