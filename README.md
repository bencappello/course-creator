# AI Course Designer

An intelligent course creation application that uses OpenAI's GPT-3.5 and DALL-E 2 to generate customized educational content.

## Features

- 🎯 **AI-Powered Course Generation**: Creates structured courses based on your prompts
- 📚 **Dynamic Content Depth**: Choose between Low, Medium, or High content depth
- 🖼️ **AI-Generated Images**: Educational illustrations created with DALL-E 2 (256x256)
- 📝 **Interactive Quizzes**: Test knowledge with auto-generated quiz questions
- 💾 **Local Storage**: Save and manage multiple courses
- ☁️ **S3 Image Storage**: Permanently store generated images in AWS S3
- 🎨 **Beautiful UI**: Modern, responsive design with glassmorphism effects

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your OpenAI API key:
   - Create a `.env.local` file in the root directory (see `.env.local.example` for template)
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your-openai-api-key-here
     ```
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. (Optional) Set up AWS S3 for permanent image storage:
   - Add AWS credentials to `.env.local`:
     ```
     AWS_ACCESS_KEY_ID=your-aws-access-key-id
     AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
     AWS_REGION=us-east-1
     S3_BUCKET_NAME=your-s3-bucket-name
     ```
   - Configure your S3 bucket:
     - Create a new S3 bucket in your AWS account
     - Enable public access for the bucket
     - Add the following bucket policy (replace `your-bucket-name`):
       ```json
       {
         "Version": "2012-10-17",
         "Statement": [
           {
             "Sid": "PublicReadGetObject",
             "Effect": "Allow",
             "Principal": "*",
             "Action": "s3:GetObject",
             "Resource": "arn:aws:s3:::your-bucket-name/courses/*"
           }
         ]
       }
       ```
   - Without S3 configuration, images will use temporary OpenAI URLs

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Create a Course**: Enter a topic and select the number of modules and content depth
2. **Review Outline**: Check the AI-generated course outline
3. **Generate Full Course**: Create complete course content with slides and quizzes
4. **Navigate Content**: Use the course viewer to browse through modules and slides
5. **Take Quizzes**: Test your knowledge with interactive quizzes
6. **Save Progress**: Courses are automatically saved to local storage

## API Models Used

- **Text Generation**: GPT-4o-mini (latest cost-effective model)
- **Image Generation**: DALL-E 2 (256x256 resolution for minimal cost)

## Technology Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- OpenAI API
- React Context for state management
- Local Storage for persistence

## Cost Optimization

This application uses cost-effective OpenAI models:
- GPT-4o-mini: ~$0.00015 per 1K input tokens, $0.0006 per 1K output tokens
- DALL-E 2: ~$0.016 per image (256x256)
- S3 Storage: ~$0.023 per GB per month (optional)

Average course generation cost: ~$0.05-0.15 (reduced with smaller images)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
