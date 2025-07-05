"use client"
import FileInput from '@/components/FileInput'
import FormField from '@/components/FormField'
import { useFileInput } from '@/lib/hooks/useFileInput'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {MAX_VIDEO_SIZE,MAX_THUMBNAIL_SIZE} from '@/constants/index'
import { getThumbnailUploadUrl, getVideoUploadUrl, saveVideoDetails } from '@/lib/actions/video'
import { useRouter } from 'next/navigation'


const uploadFileToBunny = (file:File,uploadUrl:string,accessKey:string):Promise<void>=>{
    const controller=new AbortController()
    const timeoutOd=setTimeout(()=>controller.abort(),60000)
    return fetch(uploadUrl,
        {
            method:'PUT',
            headers:{
                'Content-Type':file.type,
                AccessKey:accessKey,

            },
            body:file,
            
        }).then(response=>{
            if(!response.ok) throw new Error('Upload failed')
            })
   
}

const Upload = () => {
    const router=useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [videoDuration,setVideoDuration]=useState()

    const video=useFileInput(MAX_VIDEO_SIZE)
    const thumbnail=useFileInput(MAX_THUMBNAIL_SIZE)

    useEffect(()=>{
        if(video.duration != null || video.duration != 0){
            setVideoDuration(videoDuration)
        }
    },[video.duration])

    useEffect(()=>{
        const checkForRecordedVideo=async ()=>{
            try{
                const stored=sessionStorage.getItem('recordedVideo')
                if(!stored) return

                const {url,name,type,duration}=JSON.parse(stored);
                const blob=await fetch(url).then(res=>res.blob())
                const file= new File([blob],name,{type,lastModified:Date.now()})

                if(video.inputRef.current){
                    const dataTransfer= new DataTransfer();
                     dataTransfer.items.add(file)
                     video.inputRef.current.files=dataTransfer.files
                
                const event= new Event('change',{bubbles:true})
                video.inputRef.current?.dispatchEvent(event)

                video.handleFileChange({
                    target:{files: dataTransfer.files}
                } as ChangeEvent<HTMLInputElement>)
            }
            if(duration) setVideoDuration(duration)
                sessionStorage.removeItem('recordedVideo')
                URL.revokeObjectURL(url)
            }catch(e){
                console.error(e,'Error Loading recorded video')
            }
        }
        checkForRecordedVideo()
    },[video])


  const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        title:'',
        description:'',
        visibility:'public'
    })

 

    const handleInputChange=(e:ChangeEvent<HTMLInputElement>)=>{
        const {name,value}=e.target;
        setFormData(prevState=>({...prevState,[name]:value}))
    }

    const handleSubmit=async (e:FormEvent)=>{
        e.preventDefault()
        setIsSubmitting(true)
       
        try{
            if(!video.file || !thumbnail.file){
                setError('Please upload video and thumbnail')
                return;
            }
            if(!formData.title || !formData.description ){
                setError('Plese fill in all the details')
                return;
            }
            //Upload the video to Bunny
           
            //1. Get upload URL
            const {
                videoId,
                uploadUrl:videoUploadUrl,
                accessKey:videoAccessKey
            }= await getVideoUploadUrl()

            if(!videoUploadUrl || !videoAccessKey) throw new Error('Failed to get video upload credentials')
            
            //2. Upload the video
                await uploadFileToBunny(video.file,videoUploadUrl,videoAccessKey)

            //Upload the thumbnail to DB
            //1. Get upload URL
             const {                
                uploadUrl:thumbnailUploadUrl,
                accessKey:thumbnailAccessKey,
                cdnUrl:thumbnailCdnUrl
            }= await getThumbnailUploadUrl(videoId)

            if(!thumbnailUploadUrl || !thumbnailAccessKey || !thumbnailCdnUrl) throw new Error('Failed to get thumbnail upload credentials')

            //Attach thumbnail
            await uploadFileToBunny(thumbnail.file,thumbnailUploadUrl,thumbnailAccessKey)
            //Create a new DB entry for the video details (urls, data)
            await saveVideoDetails({
                videoId,
                thumbnailUrl:thumbnailCdnUrl,
                ...formData,
                duration:videoDuration
            })
            router.push(`/`)


        }catch(error){
            console.log('Error submitting form:',error)
        } finally{
            
            
            setIsSubmitting(false)
        }
    }

  return (
    <div className='wrapper-md upload-page'> 
        <h1>Upload a Video</h1>
        {error && <div className='error-field'>{error}</div>}


        <form className='rounded-20 shadow-10 gap-6 w-full flex flex-col px-5 py-7.5' onSubmit={handleSubmit}>
            <FormField 
                id='title'
                label='Title'
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear and concise video title"
            />
            <FormField 
                id='description'
                label='Description'
                value={formData.description}
                onChange={handleInputChange}
                as='textarea'
                placeholder="Describe what this video is about"
            />
            <FileInput 
            id="video"
            label="Video"
            accept="video/*"
            file={video.file}
            previewUrl={video.previewUrl}
            inputRef={video.inputRef}
            onChange={video.handleFileChange}
            onReset={video.resetFile}
            type="video"
            />
            <FileInput 
            id="thumbanil"
            label="Thumbnail"
            accept="image/*"
            file={thumbnail.file}
            previewUrl={thumbnail.previewUrl}
            inputRef={thumbnail.inputRef}
            onChange={thumbnail.handleFileChange}
            onReset={thumbnail.resetFile}
            type="image"
            />
              <FormField 
                id='visibility'
                label='Visibility'
                value={formData.visibility}
                onChange={handleInputChange}
                as='select'
                options={[
                    {value:'public',label:'Public'},
                    {value:'private', label:'Private'}
                ]}
            />
            <button type='submit' disabled={isSubmitting} className='submit-button'>
                {isSubmitting ? 'Uploading ...':'Upload Video'}
            </button>
        </form>
        
    </div>
  )
}

export default Upload