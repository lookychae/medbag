import { Component } from "react";

// 렌더 중 예외가 나면 하얀 화면 대신 에러를 표시.
// 원격 iPhone에서 콘솔 확인이 어려우므로 화면에 스택을 노출.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  componentDidMount() {
    // 전역 예외도 잡아서 표시 (렌더 밖에서 발생하는 것들)
    this._onError = (ev) => this.setState({ error: ev.error || new Error(ev.message || "unknown error") });
    this._onReject = (ev) => this.setState({ error: ev.reason || new Error("unhandled promise rejection") });
    window.addEventListener("error", this._onError);
    window.addEventListener("unhandledrejection", this._onReject);
  }
  componentWillUnmount() {
    window.removeEventListener("error", this._onError);
    window.removeEventListener("unhandledrejection", this._onReject);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    const info = this.state.info;
    return (
      <div style={{padding:20,background:"#111827",color:"#F87171",minHeight:"100vh",fontFamily:"monospace",fontSize:12,overflow:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#FCA5A5"}}>⚠️ 오류 발생</div>
        <div style={{marginBottom:8}}><b>메시지:</b> {String(e.message || e)}</div>
        {e.code && <div style={{marginBottom:8}}><b>code:</b> {String(e.code)}</div>}
        {e.stack && (
          <>
            <div style={{marginTop:12,marginBottom:4,color:"#FCD34D"}}>스택:</div>
            <div style={{color:"#E5E7EB"}}>{String(e.stack)}</div>
          </>
        )}
        {info?.componentStack && (
          <>
            <div style={{marginTop:12,marginBottom:4,color:"#FCD34D"}}>컴포넌트:</div>
            <div style={{color:"#E5E7EB"}}>{info.componentStack}</div>
          </>
        )}
        <div style={{marginTop:20,display:"flex",gap:10}}>
          <button onClick={() => window.location.reload()} style={{padding:"10px 16px",background:"#3B82F6",color:"white",border:"none",borderRadius:8,fontSize:13,cursor:"pointer"}}>
            새로고침
          </button>
          <button onClick={() => this.setState({error:null,info:null})} style={{padding:"10px 16px",background:"transparent",color:"#F87171",border:"1px solid #F87171",borderRadius:8,fontSize:13,cursor:"pointer"}}>
            무시하고 계속
          </button>
        </div>
      </div>
    );
  }
}
