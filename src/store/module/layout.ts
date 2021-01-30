import { login, loginParam, getRouterList, getUser } from '/@/api/layout/index'
import { ILayout, IMenubarStatus, ITagsList, IMenubarList } from '/@/type/store/layout'
import { IState } from '/@/type/store/index'
import { ActionContext } from 'vuex'
import router from '/@/router/index'
import { allowRouter } from '/@/router/index'
import { generatorDynamicRouter } from '/@/router/asyncRouter'
import changeTheme from '/@/utils/changeTheme'

const state:ILayout = {
    menubar: {
        status: document.body.offsetWidth < 768 ? IMenubarStatus.PHN : IMenubarStatus.PCE,
        menuList: [],
        isPhone: document.body.offsetWidth < 768,
    },
    // 用户信息
    userInfo: {
        name: '',
        role: []
    },
    // 标签栏
    tags: {
        tagsList: [],
        cachedViews: []
    },
    ACCESS_TOKEN: localStorage.getItem('ACCESS_TOKEN') || '',
    theme: localStorage.getItem('theme') ? Number(localStorage.getItem('theme')) : 0,
    isLoading: false
}
const mutations = {
    changeCollapsed(state: ILayout):void {
        if(state.menubar.isPhone){
            state.menubar.status = state.menubar.status === IMenubarStatus.PHN ? IMenubarStatus.PHE : IMenubarStatus.PHN
        }else{
            state.menubar.status = state.menubar.status === IMenubarStatus.PCN ? IMenubarStatus.PCE : IMenubarStatus.PCN
        }
    },
    changeDeviceWidth(state: ILayout):void {
        if(document.body.offsetWidth < 768){
            state.menubar.isPhone = true
            state.menubar.status = IMenubarStatus.PHN
        }else{
            state.menubar.isPhone = false
            state.menubar.status = IMenubarStatus.PCE
        }
    },
    // 切换导航，记录打开的导航
    changeTagNavList(state: ILayout, cRouter:IMenubarList):void {
        if(new RegExp(/\/redirect\//).test(cRouter.path)) return       // 判断是否是重定向页面
        const index = state.tags.tagsList.findIndex(v=>v.path === cRouter.path)
        state.tags.tagsList.forEach(v=>v.isActive = false)
        // 判断页面是否打开过
        if(index !== -1){
            state.tags.tagsList[index].isActive = true
            return
        }
        const tagsList:ITagsList = {
            name: cRouter.name,
            title: cRouter.meta.title,
            path: cRouter.path,
            isActive: true
        }
        state.tags.tagsList.push(tagsList)
    },
    removeTagNav(state: ILayout, obj:{tagsList:ITagsList, cPath: string}):void {
        const index = state.tags.tagsList.findIndex(v=>v.path === obj.tagsList.path)
        if(state.tags.tagsList[index].path === obj.cPath){
            state.tags.tagsList.splice(index, 1)
            const i = index === state.tags.tagsList.length ? index - 1 : index
            state.tags.tagsList[i].isActive = true
            mutations.removeCachedViews(state, { name: obj.tagsList.name, index })
            router.push({ path: state.tags.tagsList[i].path })
        }else{
            state.tags.tagsList.splice(index, 1)
            mutations.removeCachedViews(state, { name: obj.tagsList.name, index })
        }
    },
    removeOtherTagNav(state: ILayout, tagsList:ITagsList):void {
        const index = state.tags.tagsList.findIndex(v=>v.path === tagsList.path)
        state.tags.tagsList.splice(index + 1)
        state.tags.tagsList.splice(0, index)
        state.tags.cachedViews.splice(index + 1)
        state.tags.cachedViews.splice(0, index)
        router.push({ path: tagsList.path })
    },
    removeAllTagNav(state: ILayout):void {
        state.tags.tagsList.splice(0)
        state.tags.cachedViews.splice(0)
        router.push({ path: '/redirect/' })
    },
    // 添加缓存页面
    addCachedViews(state: ILayout, obj: {name: string, noCache: boolean}):void{
        if(obj.noCache || state.tags.cachedViews.includes(obj.name)) return
        state.tags.cachedViews.push(obj.name)
    },
    // 删除缓存页面
    removeCachedViews(state: ILayout, obj: { name: string, index: number }):void{
        // 判断标签页是否还有该页面
        if(state.tags.tagsList.map(v=>v.name).includes(obj.name)) return
        state.tags.cachedViews.splice(obj.index, 1)
    },
    login(state: ILayout, token = ''):void {
        state.ACCESS_TOKEN = token
        localStorage.setItem('ACCESS_TOKEN', token)
        const { query } = router.currentRoute.value
        router.push(typeof query.from === 'string' ? decodeURIComponent(decodeURIComponent(query.from)) : '/')
    },
    logout(state: ILayout):void {
        state.ACCESS_TOKEN = ''
        localStorage.removeItem('ACCESS_TOKEN')
        history.go(0)
    },
    setRoutes(state: ILayout, data: Array<IMenubarList>):void {
        state.menubar.menuList = data
    },
    concatAllowRoutes(state: ILayout):void {
        allowRouter.reverse().forEach(v=>state.menubar.menuList.unshift(v))
    },
    getUser(state: ILayout, userInfo:{name:string, role: Array<string>}):void {
        state.userInfo.name = userInfo.name
        state.userInfo.role = userInfo.role
    },
    // 修改主题
    changeTheme(state: ILayout, num?:number):void {
        if(num === state.theme) return
        if(typeof num !== 'number') num = state.theme
        changeTheme(num)
        state.theme = num
        localStorage.setItem('theme', String(num))
    }
}
const actions = {
    async login(context:ActionContext<ILayout,IState>, param: loginParam):Promise<void> {
        const res = await login(param)
        const token = res.data.Data
        context.commit('login', token)
    },
    async getUser(context:ActionContext<ILayout,IState>):Promise<void> {
        const res = await getUser()
        const userInfo = res.data.Data
        context.commit('getUser', userInfo)
    },
    async GenerateRoutes():Promise<void> {
        const res = await getRouterList()
        const { Data } = res.data
        generatorDynamicRouter(Data)
    }
}
const layoutState = {
    namespaced: true,
    state,
    mutations,
    actions
}

export default layoutState