from fastapi import FastAPI, UploadFile

app = FastAPI()


@app.post('/upload')
def upload(file: UploadFile):
    return {
        'filename': file.filename,
        'url': f'https://cdn.fake/{file.filename}',
    }
