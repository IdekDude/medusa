import type { TagsProps } from "@/components/Tags"
import dynamic from "next/dynamic"
import Loading from "./loading"
import AdminDescription from "./_mdx/admin.mdx"
import Section from "@/components/Section"

const Tags = dynamic<TagsProps>(async () => import("@/components/Tags"), {
  loading: () => <Loading />,
}) as React.FC<TagsProps>

const ReferencePage = async () => {
  return (
    <div>
      <Section>
        <AdminDescription />
      </Section>
      <Tags />
    </div>
  )
}

export default ReferencePage
