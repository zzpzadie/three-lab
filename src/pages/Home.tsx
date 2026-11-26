// 卡片区页面GalleryPage
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMajor, getSubGroup } from '@/data/catalog'
import { Card, Col, Row, Typography } from 'antd'
import { useEffect } from 'react'

export default function Home() {
  const { majorId = 'three', subId } = useParams()
  const navigate = useNavigate()
  const major = getMajor(majorId)
  // 无 subId：默认第一个子分组
  const activeSub =
    (subId && getSubGroup(majorId, subId)) ||
    major?.groups[0]?.children[0]
  useEffect(() => {
    if (major && !subId && activeSub) {
      navigate(`/${majorId}/${activeSub.id}`, { replace: true })
    }
  }, [majorId, subId, activeSub])
  return (
    <div>
      <Typography.Title level={3} style={{ borderBottom: '2px solid #cf1322' }}>{activeSub?.title}</Typography.Title>
      <Row gutter={[16, 16]}>
        {activeSub?.examples.map((item) => (
          <Col key={item.id} span={6} >
            <Link to={item.path}>   {/* → /examples/three/01-basics */}
              <Card 
              hoverable 
              cover={
                item.thumb ? (
                <img 
                src={item.thumb} 
                alt="" 
                style={{ width: '100%', height: 160 , objectFit: 'cover', display: 'block' }} /> 

                ) : null
              }>
                <Card.Meta title={item.title} description={item.desc} />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  )
}